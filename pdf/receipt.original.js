/**
 * receipt.original.js
 * Full conversion of the provided FPDF(PHP) receipt into PDFKit(JS) layout (A5, mm-like coordinates).
 * NOTE:
 * - This is a layout-faithful port. It DOES NOT map real data yet (placeholders only).
 * - Assumes THSarabunNew.ttf is in the same folder as this file.
 * - Uses absolute positioning + per-side borders to emulate FPDF Cell/MultiCell with 'TLR' etc.
 */

const PDFDocument = require('pdfkit')
const path = require('path')

module.exports = (res, orders = []) => {
  if (res.headersSent || res.writableEnded) {
    console.error('Response already ended before PDF start')
    return
  }

  // A5 Portrait in PDF points. We will draw in "mm-like units" by scaling.
  // FPDF used mm; PDFKit uses points. We'll use a simple mm->pt conversion.
  const MM_TO_PT = 2.834645669 // 1 mm = 2.8346 pt

  const doc = new PDFDocument({
    size: 'A5',
    margins: { top: 0, left: 0, right: 0, bottom: 0 }
  })

  // Fonts
  const fontPath = path.join(__dirname, 'THSarabunNew.ttf')
  const fontPathB = path.join(__dirname, 'THSarabunNew_Bold.ttf')
  doc.registerFont('THSarabunNew', fontPath)
  doc.registerFont('THSarabunNew_Bold', fontPathB) // no separate bold file; use same

  // Safety error handler
  doc.on('error', err => {
    console.error('PDF error:', err)
    if (!res.headersSent && !res.writableEnded) res.status(500).end()
  })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'inline; filename=receipt-original.pdf')
  doc.pipe(res)

  // If no orders passed, still render 1 demo page (placeholders)
  const list = Array.isArray(orders) && orders.length ? orders : [{}]

  let currentPageNumber = 1
  // console.log('Generating receipt original PDF for', orders, 'orders')
  for (let i = 0; i < list.length; i++) {
    if (i > 0) doc.addPage()
    const pdf = new ReceiptPDF(doc, {
      mmToPt: MM_TO_PT,
      pageNumber: currentPageNumber
    })
    pdf.setCopyType('ต้นฉบับ')
    pdf.invoice(list[i]) // no data mapping yet, placeholders
    currentPageNumber++
  }

  doc.end()
}

/**
 * ReceiptPDF: a tiny helper to emulate the FPDF class behavior with PDFKit.
 * Uses mm-like coordinates to keep layout aligned with the PHP version.
 */
class ReceiptPDF {
  constructor (doc, { mmToPt, pageNumber }) {
    this.doc = doc
    this.MM_TO_PT = mmToPt
    this.currentPageNumber = pageNumber || 1
    this.copyType = 'ต้นฉบับ'

    // Table widths used in PHP
    this.colWidths = [10, 56, 10, 10, 15, 12, 20] // sum = 133 mm
    // Signature widths in PHP Row()
    this.signWidths = [33, 33, 33, 33]

    // Cursor emulation (mm)
    this.x = 0
    this.y = 0
  }

  setCopyType (type) {
    this.copyType = type || 'ต้นฉบับ'
  }

  // ===== Utilities (mm -> pt) =====
  mm (v) {
    return v * this.MM_TO_PT
  }

  // ===== Text measurement in PDFKit (approx) =====
  // We keep it simple since we are not mapping data yet.
  // Once mapping data, you can use doc.heightOfString/doc.widthOfString in points.
  // Here we only need it for the reference line wrap logic.
  getTextWidthMm (text, fontSize = 12) {
    const d = this.doc
    d.font('THSarabunNew').fontSize(fontSize)
    const wPt = d.widthOfString(String(text || ''))
    return wPt / this.MM_TO_PT
  }

  // ===== Border drawing per-side (emulates FPDF 'TLR', etc.) =====
  drawBordersMm (x, y, w, h, border) {
    const d = this.doc
    const xPt = this.mm(x)
    const yPt = this.mm(y)
    const wPt = this.mm(w)
    const hPt = this.mm(h)

    d.lineWidth(0.3)

    if (border.includes('T'))
      d.moveTo(xPt, yPt)
        .lineTo(xPt + wPt, yPt)
        .stroke()
    if (border.includes('L'))
      d.moveTo(xPt, yPt)
        .lineTo(xPt, yPt + hPt)
        .stroke()
    if (border.includes('R'))
      d.moveTo(xPt + wPt, yPt)
        .lineTo(xPt + wPt, yPt + hPt)
        .stroke()
    if (border.includes('B'))
      d.moveTo(xPt, yPt + hPt)
        .lineTo(xPt + wPt, yPt + hPt)
        .stroke()
  }

  // ===== Basic Cell (absolute) =====
  // Equivalent-ish to FPDF::Cell with borders
  cellMm (
    x,
    y,
    w,
    h,
    text,
    border = '',
    align = 'L',
    fontSize = 12,
    style = ''
  ) {
    const d = this.doc
    d.font('THSarabunNew')
    d.fontSize(fontSize)

    // borders
    if (border) this.drawBordersMm(x, y, w, h, border)

    // text
    const alignMap = { L: 'left', C: 'center', R: 'right' }
    const a = alignMap[align] || 'left'

    d.text(String(text || ''), this.mm(x + 1.5), this.mm(y + 1.2), {
      width: this.mm(w - 3),
      height: this.mm(h - 2),
      align: a
      // lineBreak: false
    })
  }

  // ===== MultiCell (absolute start) =====
  // Minimal emulation: draws borders (LR etc.), writes wrapped text inside width.
  // Returns the computed height in mm actually consumed.
  multiCellMm (x, y, w, lineH, text, border = '', align = 'L', fontSize = 12) {
    const d = this.doc
    d.font('THSarabunNew').fontSize(fontSize)

    // Write text with wrapping; calculate height in points then convert.
    const options = {
      width: this.mm(w - 3),
      align: align === 'C' ? 'center' : align === 'R' ? 'right' : 'left'
    }
    const textPtH = d.heightOfString(String(text || ''), options)
    const textMmH = textPtH / this.MM_TO_PT

    // Minimum 1 line height (like FPDF)
    const minH = lineH
    const usedH = Math.max(minH, Math.ceil(textMmH / lineH) * lineH)

    // Draw borders around each line block as one rectangle side-strokes
    if (border) this.drawBordersMm(x, y, w, usedH, border)

    // Print
    d.text(String(text || ''), this.mm(x + 1.5), this.mm(y + 1.2), {
      width: this.mm(w - 3),
      align: options.align
    })

    return usedH
  }

  // ===== Thai number to words (placeholder, port later if you want) =====
  thaiNumberToWords (amount) {
    const numberText = [
      '',
      'หนึ่ง',
      'สอง',
      'สาม',
      'สี่',
      'ห้า',
      'หก',
      'เจ็ด',
      'แปด',
      'เก้า'
    ]
    const positionText = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']

    const convert = numStr => {
      let output = ''
      const chars = numStr.split('').reverse()
      chars.forEach((c, i) => {
        if (c !== '0') {
          let txt = numberText[c] + positionText[i % 6]
          if (i % 6 === 0 && i > 0) txt = positionText[6] + txt
          output = txt + output
        }
      })
      return output
        .replace('หนึ่งสิบ', 'สิบ')
        .replace('สองสิบ', 'ยี่สิบ')
        .replace('สิบหนึ่ง', 'สิบเอ็ด')
    }

    const n = Math.abs(Number(amount || 0)).toFixed(2)
    const [int, frac] = n.split('.')

    const baht = convert(int)
    const satang = frac !== '00' ? convert(frac) + 'สตางค์' : 'ถ้วน'

    return baht ? `${baht}บาท${satang}` : 'ศูนย์บาทถ้วน'
  }

  // ===== Header / Footer (like FPDF Header/Footer) =====
  header () {
    // PHP Header() used SetXY(10,4) and then a sequence of Cells.
    // We'll place at fixed mm positions for a stable layout.
    const d = this.doc

    // Left company block
    d.font('THSarabunNew_Bold').fontSize(12)
    d.text('บริษัท วันทูเทรดดิ้ง จำกัด', this.mm(10), this.mm(4))
    d.font('THSarabunNew').fontSize(12)
    d.text(
      '58/3 หมู่ที่ 6 ถ.พระประโทน-บ้านแพ้ว ต.ตลาดจินดา',
      this.mm(10),
      this.mm(9)
    )

    // บรรทัดซ้าย
    d.font('THSarabunNew').fontSize(12)
    d.text('อ.สามพราน จ.นครปฐม 73110', this.mm(10), this.mm(13))

    // บรรทัดขวา (กึ่งกลางระหว่าง 13 กับ 17)
    d.font('THSarabunNew_Bold').fontSize(14)
    d.text(
      'บิลเงินสด / ใบกำกับภาษี',
      this.mm(10),
      this.mm(15), // ⭐ จุดสำคัญ
      {
        width: this.mm(133),
        align: 'right'
      }
    )

    // บรรทัดล่าง
    d.font('THSarabunNew').fontSize(12)
    d.text('โทร. (034)981-555', this.mm(10), this.mm(17))

    d.text(
      'เลขประจำตัวผู้เสียภาษี 0105563063410 ออกใบกำกับภาษีโดยสำนักงานใหญ่                           เอกสารออกเป็นชุด',
      this.mm(10),
      this.mm(21),
      { width: this.mm(133) }
    )
  }

  footer () {
    const d = this.doc
    d.font('THSarabunNew').fontSize(8)
    // FPDF: SetY(-10) => 10 mm from bottom.
    // A5 height is 210 mm. Put footer at 200 mm baseline.
    d.text(`Page ${this.currentPageNumber}`, 0, this.mm(200), {
      width: this.mm(148),
      align: 'center'
    })
  }

  // ===== Table Header (like PHP TableHeader) =====
  tableHeader (data) {
    function formatDateYYYYMMDD (value) {
      if (!value) return ''
      const d = value instanceof Date ? value : new Date(value)
      if (isNaN(d.getTime())) return ''
      return d.toISOString().slice(0, 10)
    }
    const docDate = formatDateYYYYMMDD(data.updatedAt)
    const HEADER_LAST_Y = 21
    const HEADER_TABLE_GAP = 4
    const TABLE_START_Y = HEADER_LAST_Y + HEADER_TABLE_GAP
    // Use exact mm positions per PHP:
    // left block at x=10, y=25; width 88; height 6 lines
    // right block at x=98, y=25; width 45; height 6 lines
    const xL = 10
    const xR = 98
    const y0 = TABLE_START_Y + 1
    const wL = 88
    const wR = 45
    const h = 6

    // Row 1
    this.cellMm(
      xL,
      y0,
      wL,
      h,
      `รหัส: ${data.customercode}  เลขประจำตัวผู้เสียภาษี: ${data.customeridnumber}`,
      'TLR',
      'L',
      12
    )
    this.cellMm(xR, y0, wR, h, `เลขที่เอกสาร: ${data.invno}`, 'TR', 'L', 12)

    // Row 2
    this.cellMm(
      xL,
      y0 + 6,
      wL,
      h,
      `ชื่อลูกค้า: ${data.customername}`,
      'LR',
      'L',
      12
    )
    this.cellMm(xR, y0 + 6, wR, h, `วันที่เอกสาร: ${docDate}`, 'R', 'L', 12)

    // Row 3-4 (Address as MultiCell in PHP)
    // In PHP it uses multiCell(88,6, 'ที่อยู่: ...', 'LR', 0); then an empty multiCell row for padding.
    const addrText = `ที่อยู่: ${data.shippingaddress || ''}`

    const usedH = this.multiCellMm(xL, y0 + 12, wL, 6, addrText, 'LR', 'L', 12)

    // บังคับให้สูงอย่างน้อย 12 mm (เหมือน PHP)
    if (usedH < 12) {
      this.drawBordersMm(xL, y0 + 12 + usedH, wL, 12 - usedH, 'LR')
    }

    // Ensure at least 12 mm area like PHP (it effectively ends at y=43)
    // PHP: after address multiCell, it sets XY(10,43) and multiCell empty 88,6 'LR'
    // We'll force the block to reach y=43 by adding a blank LR band at y=43.
    this.multiCellMm(xL, y0 + 18, wL, 6, '', 'LR', 'L', 12)

    // Right side: at y=37 => row "เลขที่รายการ"
    this.cellMm(xR, y0 + 12, wR, h, `เลขที่รายการ: ${data.cono}`, 'R', 'L', 12)

    // Reference wrapping logic (PHP checks GetStringWidth > 45)
    const refLine = `เลขที่อ้างอิง: ${data.number}`
    const wRef = this.getTextWidthMm(refLine, 15)

    if (wRef > wR) {
      this.cellMm(xR, y0 + 18, wR, h, 'เลขที่อ้างอิง:', 'R', 'L', 12)
      this.multiCellMm(xR, y0 + 23, wR, h, `${data.number}`, 'R', 'L', 12)
    } else {
      this.multiCellMm(xR, y0 + 18, wR, h, refLine, 'R', 'L', 12)
    }
    // Bottom closing row (y=49)
    this.cellMm(xL, y0 + 24, wL, h, '', 'LBR', 'L', 12)
    this.cellMm(xR, y0 + 24, wR, h, '', 'BR', 'L', 12)
  }

  wrapAddress3Lines (
    text,
    maxCharsLine1 = 60,
    maxCharsLine2 = 60,
    maxCharsLine3 = 60
  ) {
    if (!text) return ''

    const prefix = 'ที่อยู่: '
    const body = String(text).replace(prefix, '')

    const line1Body = body.slice(0, maxCharsLine1)
    const rest1 = body.slice(maxCharsLine1)

    if (!rest1) {
      return prefix + line1Body
    }

    const line2Body = rest1.slice(0, maxCharsLine2)
    const rest2 = rest1.slice(maxCharsLine2)

    if (!rest2) {
      return `${prefix}${line1Body}\n${line2Body}`
    }

    const line3Body = rest2.slice(0, maxCharsLine3)

    return `${prefix}${line1Body}\n${line2Body}\n${line3Body}`
  }

  // ===== Table Column Header (like PHP TableColumn) =====
  tableColumn () {
    // In PHP: starts right after TableHeader() and prints filled gray header.
    // We'll draw gray fill rect and borders for each cell at y=55 (approx),
    // but actually in PHP the table starts right after y=49 then next line.
    const y = 55
    const x = 10

    // Gray fill across all columns
    this.doc
      .save()
      .fillColor('#C8C8C8')
      .rect(this.mm(x), this.mm(y), this.mm(133), this.mm(7))
      .fill()
      .restore()

    let cx = x
    const labels = [
      'ลำดับ',
      'รายการสินค้า',
      'จำนวน',
      'หน่วย',
      'ราคา',
      'ส่วนลด',
      'จำนวนเงิน'
    ]
    const aligns = ['C', 'C', 'C', 'C', 'C', 'C', 'C']
    for (let i = 0; i < this.colWidths.length; i++) {
      const w = this.colWidths[i]
      this.cellMm(cx, y, w, 7, labels[i], 'LTRB', aligns[i], 12)
      cx += w
    }
  }

  fmtMoney (val) {
    const n = Number(val)
    return isNaN(n) ? '0.00' : n.toFixed(2)
  }

  // ===== Invoice (like PHP Invoice) =====
  invoice (data) {
    // Page header/footer happen per page in FPDF automatically; we call explicitly.
    this.header()

    // Body
    this.tableHeader(data)
    this.tableColumn()

    // Table rows
    // In PHP: writes rows with borders 'L' and last col 'LR', and on overflow: sign+new page.
    // Here: we render 12 rows with placeholders (since no mapping yet).
    // const maxLines = data.listProduct.length || 0
    // let y = 62 // row start right under column header (55 + 7)
    // const rowH = 7

    const TABLE_START_Y = 62
    const TABLE_END_Y = 150
    const rowH = 7
    let y = TABLE_START_Y

    const items = data?.listProduct || [] // ตอนนี้ยัง placeholder ได้

    for (let i = 0; i < items.length; i++) {
      // Overflow logic placeholder (match PHP threshold ~150mm)
      if (y > 150) {
        // Draw top line across columns like PHP does with 0-height cells w/ 'T'
        // We'll just draw a single top border line across table width.
        this.drawBordersMm(10, y, 133, 0.1, 'T')

        // Sign area then new page
        this.signBill()
        this.doc.addPage()
        this.currentPageNumber += 1
        this.header()
        this.tableHeader(data)
        this.tableColumn()
        y = 62
      }

      let cx = 10

      // index
      this.cellMm(cx, y, 10, rowH, String(i + 1), 'L', 'C', 12)
      cx += 10

      // name
      this.cellMm(cx, y, 56, rowH, items[i].name, 'L', 'L', 12)
      cx += 56

      // qty
      this.cellMm(cx, y, 10, rowH, items[i].quantity, 'L', 'C', 12)
      cx += 10

      // unit
      this.cellMm(cx, y, 10, rowH, 'ชิ้น', 'L', 'C', 12)
      cx += 10

      // price
      this.cellMm(
        cx,
        y,
        15,
        rowH,
        this.fmtMoney(items[i]?.pricePerUnit),
        'L',
        'C',
        12
      )
      cx += 15

      // discount
      this.cellMm(
        cx,
        y,
        12,
        rowH,
        this.fmtMoney(items[i]?.discount),
        'L',
        'C',
        12
      )
      cx += 12

      // amount (last has LR)
      this.cellMm(
        cx,
        y,
        20,
        rowH,
        this.fmtMoney(items[i]?.totalprice),
        'LR',
        'R',
        12
      )
      y += rowH
    }

    while (y + rowH <= TABLE_END_Y) {
      let cx = 10

      this.cellMm(cx, y, 10, rowH, '', 'L')
      cx += 10
      this.cellMm(cx, y, 56, rowH, '', 'L')
      cx += 56
      this.cellMm(cx, y, 10, rowH, '', 'L')
      cx += 10
      this.cellMm(cx, y, 10, rowH, '', 'L')
      cx += 10
      this.cellMm(cx, y, 15, rowH, '', 'L')
      cx += 15
      this.cellMm(cx, y, 12, rowH, '', 'L')
      cx += 12
      this.cellMm(cx, y, 20, rowH, '', 'LR')

      y += rowH
    }

    // Summary block (like PHP)
    // PHP after filling blank lines:
    // left: Cell(88,28, '(' . thai_number_to_words(totalamount) . ')', 'TL', 0, 'C')
    // right: 4 lines of 25+20 cells with borders.
    const sumY = y // directly after rows (same as PHP)
    // วาดกรอบเหมือนเดิม
    const SUM_X = 10
    const SUM_W = 88
    const SUM_H = 28
    const SUM_FONT = 14
    // const SUM_TEXT = `(${this.thaiNumberToWords(300)})`
    const SUM_TEXT = `(${this.thaiNumberToWords(data.amount)})`

    // วาดกรอบบน + ซ้าย
    this.drawBordersMm(SUM_X, sumY, SUM_W, SUM_H, 'TL')

    // วัดความสูงข้อความจริง (pt → mm)
    this.doc.font('THSarabunNew_Bold').fontSize(SUM_FONT)

    const textHeightPt = this.doc.heightOfString(SUM_TEXT, {
      width: this.mm(SUM_W),
      align: 'center'
    })

    const textHeightMm = textHeightPt / this.MM_TO_PT

    // ⭐ center ที่แท้จริง
    const centerTextY = sumY + (SUM_H - textHeightMm) / 2

    // วาด text
    this.doc.text(SUM_TEXT, this.mm(SUM_X), this.mm(centerTextY), {
      width: this.mm(SUM_W),
      align: 'center'
    })

    // ปิดกรอบล่าง + ซ้าย
    this.drawBordersMm(SUM_X, sumY + 21, SUM_W, 7, 'LB')

    // this.cellMm(
    //   10,
    //   sumY,
    //   88,
    //   28,
    //   `(${this.thaiNumberToWords(300)})`,
    //   'TL',
    //   'C',
    //   14
    // )

    const amount = data?.amount || 0
    const baseAmount = amount / 1.07
    const vatAmount = amount - baseAmount
    const examont = amount - vatAmount

    // Right summary
    this.cellMm(98, sumY, 25, 7, 'ส่วนลดการค้า', 'TL', 'L', 12)
    this.cellMm(123, sumY, 20, 7, this.fmtMoney(data?.discount), 'TLR', 'R', 12)

    this.cellMm(10, sumY + 7, 88, 7, '', 'L', 'L', 12)
    this.cellMm(98, sumY + 7, 25, 7, 'รวมราคาสินค้า', 'L', 'L', 12)
    this.cellMm(123, sumY + 7, 20, 7, this.fmtMoney(examont), 'LR', 'R', 12)

    this.cellMm(10, sumY + 14, 88, 7, '', 'L', 'L', 12)
    this.cellMm(98, sumY + 14, 25, 7, 'ภาษีมูลค่าเพิ่ม 7%', 'L', 'L', 12)
    this.cellMm(123, sumY + 14, 20, 7, this.fmtMoney(vatAmount), 'LR', 'R', 12)

    this.cellMm(10, sumY + 21, 88, 7, '', 'LB', 'L', 12)
    this.cellMm(98, sumY + 21, 25, 7, 'จำนวนเงินรวมสุทธิ', 'LB', 'L', 12)
    this.cellMm(
      123,
      sumY + 21,
      20,
      7,
      this.fmtMoney(data?.amount),
      'LRB',
      'R',
      12
    )

    // Spacer then sign
    this.signBill(sumY + 28 + 3)

    // Footer
    this.footer()
  }

  // ===== Signature area (like PHP SignBill + Row helper) =====
  signBill (yOverride) {
    // In PHP, SignBill uses Row() with widths [33,33,33,33] and height from NbLines.
    // We'll place it fixed near bottom based on current content if not provided.
    const y = typeof yOverride === 'number' ? yOverride : 180
    const x = 10
    const h = 6
    const d = this.doc

    // 1st line: dotted / 108-DC / signature image placeholder / Sale Online
    let cx = x
    this.multiCellMm(cx, y, 33, h, '............................', '', 'C', 12)
    cx += 33
    this.multiCellMm(cx, y, 33, h, '......108-DC Online.....', '', 'C', 12)
    cx += 33

    // Signature image placeholder: in PHP it's img/signature.png centered.
    // Here we just draw a small placeholder box to reserve the space.
    // const sigBoxX = cx
    // const sigBoxY = y - 4
    // d.rect(
    //   this.mm(sigBoxX + 6),
    //   this.mm(sigBoxY),
    //   this.mm(21),
    //   this.mm(10)
    // ).stroke()
    // cx += 33

    // === ผู้ตรวจสอบ : ใส่รูปแทนกรอบ ===
    const sigBoxX = cx
    const sigBoxY = y - 2

    const CHECK_IMG = path.join(__dirname, 'img/signature.png')

    // ขนาดช่อง (เท่ากับคอลัมน์ 33 mm)
    const BOX_W = 33
    const BOX_H = 10

    // ขนาดรูป (ปรับได้)
    const IMG_W = 18
    const IMG_H = 8

    this.doc.image(
      CHECK_IMG,
      this.mm(sigBoxX + (BOX_W - IMG_W) / 2),
      this.mm(sigBoxY + (BOX_H - IMG_H) / 2),
      {
        width: this.mm(IMG_W),
        height: this.mm(IMG_H)
      }
    )

    this.doc
      .font('THSarabunNew')
      .fontSize(12)
      .text(
        '....................',
        this.mm(sigBoxX),
        this.mm(sigBoxY + 3), // ระยะห่างใต้รูป
        {
          width: this.mm(BOX_W),
          align: 'center'
        }
      )

    cx += 33

    this.multiCellMm(cx, y, 33, h, '.......Sale Online......', '', 'C', 12)

    // 2nd line: labels
    cx = x
    this.multiCellMm(cx, y + 6, 33, h, 'ผู้รับของ (ลูกค้า)', '', 'C', 12)
    cx += 33
    this.multiCellMm(cx, y + 6, 33, h, 'ผู้ส่งของ', '', 'C', 12)
    cx += 33
    this.multiCellMm(cx, y + 6, 33, h, 'ผู้ตรวจสอบ', '', 'C', 12)
    cx += 33
    this.multiCellMm(cx, y + 6, 33, h, 'ผู้รับเงิน', '', 'C', 12)
  }
}
