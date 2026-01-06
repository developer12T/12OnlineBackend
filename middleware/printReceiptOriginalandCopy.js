const PDFDocument = require('pdfkit')
const { getDataPrintReceipt } = require('../middleware/erpAndM3')

function thaiNumberToWords(amount) {
    const absAmount = Math.abs(amount)
    const formatted = absAmount.toFixed(2) // ให้เหมือน number_format
    const [integer, fraction] = formatted.split('.')

    const baht = convert(integer)
    const satang = convert(fraction)

    let output = amount < 0 ? 'ลบ' : ''
    output += baht ? baht + 'บาท' : ''
    output += satang ? satang + 'สตางค์' : 'ถ้วน'

    return baht + satang === '' ? 'ศูนย์บาทถ้วน' : output
}

function convert(number) {
    const values = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
    const places = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']
    const exceptions = {
        'หนึ่งสิบ': 'สิบ',
        'สองสิบ': 'ยี่สิบ',
        'สิบหนึ่ง': 'สิบเอ็ด'
    }

    let output = ''
    const reversed = number.split('').reverse()

    reversed.forEach((value, place) => {
        if (place % 6 === 0 && place > 0) {
            output = places[6] + output
        }

        if (value !== '0') {
            output = values[Number(value)] + places[place % 6] + output
        }
    })

    Object.entries(exceptions).forEach(([search, replace]) => {
        output = output.replace(search, replace)
    })

    return output
}


class PDFGenerator {
    constructor() {
        this.doc = new PDFDocument({ size: 'A4', margin: 20 })
        this.currentBill = 1
        this.currentPageNumber = 1
        this.copyTYPE = ''
    }

    setCopyTYPE(type) {
        this.copyTYPE = type
    }

    Header() {
        this.doc
            .font('THSarabunNew-Bold')
            .fontSize(12)
            .text('บริษัท วันทูเทรดดิ้ง จำกัด', 10, 10)

        this.doc
            .font('THSarabunNew')
            .fontSize(12)
            .text('58/3 หมู่ที่ 6 ถ.พระประโทน-บ้านแพ้ว ต.ตลาดจินดา', 10, 25)

        this.doc
            .text('อ.สามพราน จ.นครปฐม 73110', 10, 40)

        this.doc
            .fontSize(14)
            .text(
                `${this.copyTYPE}บิลเงินสด / ใบกำกับภาษี`,
                0,
                10,
                { align: 'right' }
            )

        this.doc
            .fontSize(12)
            .text('โทร. (034)981-555', 10, 60)

        this.doc
            .text(
                'เลขประจำตัวผู้เสียภาษี 0105563063410 ออกใบกำกับภาษีโดยสำนักงานใหญ่',
                10,
                75
            )
    }
    Footer() {
        const bottomY = this.doc.page.height - 30

        this.doc
            .font('THSarabunNew')
            .fontSize(8)
            .text(
                `Page ${this.currentPageNumber}`,
                0,
                bottomY,
                {
                    align: 'center'
                }
            )
    }

    TableHeader(data) {
        const doc = this.doc

        doc.font('THSarabunNew').fontSize(12)

        // ===== Row 1 =====
        doc.text(
            `รหัส: ${data.customer.customercode}  เลขประจำตัวผู้เสียภาษี: ${data.customer.customeridnumber}`,
            10,
            25,
            { width: 88 }
        )

        doc.text(
            `เลขที่เอกสาร: ${data.invno}`,
            98,
            25,
            { width: 45 }
        )

        // ===== Row 2 =====
        const customerName = data.customer.customername
            .replace(/\u200B/g, '')
            .replace(/·/g, ' ')

        doc.text(
            `ชื่อลูกค้า: ${customerName}`,
            10,
            31,
            { width: 88 }
        )

        doc.text(
            `วันที่เอกสาร: ${data.updatedatetime}`,
            98,
            31,
            { width: 45 }
        )

        // ===== Address =====
        let addressText = ''
        if (data.printinv === 'TaxInvoice') {
            addressText = data.customer.customeraddress
        } else {
            addressText = data.address.shippingaddress
        }

        addressText = addressText
            .replace(/\u200B/g, '')
            .replace(/·/g, ' ')

        doc.text(
            `ที่อยู่: ${addressText}`,
            10,
            37,
            { width: 88 }
        )

        // ===== Right column =====
        doc.text(
            `เลขที่รายการ: ${data.cono}`,
            98,
            37,
            { width: 45 }
        )

        const refText = `เลขที่อ้างอิง: ${data.number}`
        const textWidth = doc.widthOfString(refText)

        if (textWidth > 45) {
            doc.text('เลขที่อ้างอิง:', 98, 43, { width: 45 })
            doc.text(data.number, 98, 49, { width: 45 })
        } else {
            doc.text(refText, 98, 43, { width: 45 })
        }

        // ===== Bottom spacing (แทน Cell ว่าง) =====
        doc.text('', 10, 49, { width: 88 })
        doc.text('', 98, 49, { width: 45 })
    }
    TableColumn(startX = 10, startY = 60) {
        const doc = this.doc

        // สีพื้นหลัง (เทา)
        const fillColor = '#C8C8C8' // rgb(200,200,200)
        const textColor = '#000000'

        // กำหนด column
        const columns = [
            { label: 'ลำดับ', width: 8 },
            { label: 'รายการสินค้า', width: 60 },
            { label: 'จำนวน', width: 10 },
            { label: 'หน่วย', width: 10 },
            { label: 'ราคา', width: 15 },
            { label: 'ส่วนลด', width: 10 },
            { label: 'จำนวนเงิน', width: 20 }
        ]

        const rowHeight = 7
        let x = startX
        const y = startY

        doc.font('THSarabunNew').fontSize(12)

        columns.forEach(col => {
            // พื้นหลัง
            doc
                .save()
                .rect(x, y, col.width, rowHeight)
                .fill(fillColor)
                .restore()

            // กรอบ
            doc.rect(x, y, col.width, rowHeight).stroke()

            // ตัวอักษร (จัดกลาง)
            doc
                .fillColor(textColor)
                .text(col.label, x, y + 1.5, {
                    width: col.width,
                    align: 'center'
                })

            x += col.width
        })
    }

    SignBill(startX = 10, startY = this.doc.y + 10) {
        const doc = this.doc

        doc.font('THSarabunNew').fontSize(12)

        // ความกว้างคอลัมน์ (รวมกัน ~132)
        const widths = [33, 33, 33, 33]
        const rowHeight = 18
        let x = startX
        let y = startY

        // ===== Row 1 : เส้น / ลายเซ็น =====
        const row1 = [
            '............................',
            '......108-DC Online.....',
            'img/signature.png',
            '.......Sale Online......'
        ]

        row1.forEach((cell, i) => {
            const w = widths[i]

            // กรอบ
            doc.rect(x, y, w, rowHeight).stroke()

            if (cell.endsWith('.png')) {
                // แทรกรูปลายเซ็น
                doc.image(cell, x + 3, y + 3, {
                    width: w - 6,
                    height: rowHeight - 6,
                    align: 'center'
                })
            } else {
                // ข้อความ
                doc.text(cell, x, y + 5, {
                    width: w,
                    align: 'center'
                })
            }

            x += w
        })

        // ===== Row 2 : คำอธิบาย =====
        x = startX
        y += rowHeight

        const row2 = [
            'ผู้รับของ (ลูกค้า)',
            'ผู้ส่งของ',
            'ผู้ตรวจสอบ',
            'ผู้รับเงิน'
        ]

        row2.forEach((cell, i) => {
            const w = widths[i]

            doc.rect(x, y, w, rowHeight).stroke()

            doc.text(cell, x, y + 5, {
                width: w,
                align: 'center'
            })

            x += w
        })

        // ขยับ cursor ลง (เหมือน Row จบ)
        doc.moveDown(2)
    }

    drawCell(x, y, w, h, text, align = 'left') {
        const doc = this.doc
        doc.rect(x, y, w, h).stroke()
        doc.text(String(text), x + 2, y + 2, {
            width: w - 4,
            align
        })
    }

    drawTopBorderRow(x, y, col) {
        const doc = this.doc
        Object.values(col).forEach(w => {
            doc.moveTo(x, y).lineTo(x + w, y).stroke()
            x += w
        })
    }

    drawSummaryRow(y, label, value, boldBottom = false) {
        const doc = this.doc
        const startX = 98

        this.drawCell(98, y, 25, 7, label, 'left')
        this.drawCell(
            123,
            y,
            20,
            7,
            Number(value).toFixed(2),
            'right'
        )

        if (boldBottom) {
            doc.moveTo(98, y + 7).lineTo(143, y + 7).stroke()
        }
    }

    Invoice(data) {
        const doc = this.doc

        this.TableHeader(data)
        this.TableColumn()

        const maxLines = 12
        let currentLine = 0

        const startX = 10
        let y = doc.y + 5

        const col = {
            no: 8,
            name: 60,
            qty: 10,
            unit: 10,
            price: 15,
            discount: 10,
            total: 20
        }

        const rowHeight = 7

        data.list.forEach((item, index) => {
            // ===== Page break =====
            if (y > 150) {
                this.drawTopBorderRow(startX, y, col)
                y += 8

                this.SignBill()
                doc.addPage()
                this.currentBill++
                this.currentPageNumber++

                this.TableHeader(data)
                this.TableColumn()
                y = doc.y + 5
            }

            let x = startX

            // ลำดับ
            this.drawCell(x, y, col.no, rowHeight, index + 1, 'center')
            x += col.no

            // ชื่อสินค้า
            this.drawCell(x, y, col.name, rowHeight, item.name, 'left')
            x += col.name

            // จำนวน
            this.drawCell(x, y, col.qty, rowHeight, item.number, 'center')
            x += col.qty

            // หน่วย
            const subsku = item.sku.split('_')
            const unit = this.getUnit(subsku[1])
            this.drawCell(x, y, col.unit, rowHeight, unit, 'center')
            x += col.unit

            // ราคา
            this.drawCell(
                x,
                y,
                col.price,
                rowHeight,
                item.pricepernumber.toFixed(2),
                'center'
            )
            x += col.price

            // ส่วนลด
            this.drawCell(
                x,
                y,
                col.discount,
                rowHeight,
                item.discountamount.toFixed(2),
                'center'
            )
            x += col.discount

            // รวม
            this.drawCell(
                x,
                y,
                col.total,
                rowHeight,
                item.totalprice.toFixed(2),
                'right'
            )

            y += rowHeight
            currentLine++
        })

        // ===== เติมบรรทัดว่าง =====
        while (currentLine < maxLines) {
            let x = startX
            Object.values(col).forEach(w => {
                doc.rect(x, y, w, rowHeight).stroke()
                x += w
            })
            y += rowHeight
            currentLine++
        }

        // ===== Summary =====
        doc.font('THSarabunNew-Bold').fontSize(14)

        this.drawCell(
            startX,
            y,
            88,
            28,
            `(${thaiNumberToWords(data.totalamount)})`,
            'center'
        )

        doc.font('THSarabunNew-Bold').fontSize(12)

        this.drawSummaryRow(y, 'ส่วนลดการค้า', data.discount)
        y += rowHeight

        this.drawSummaryRow(y, 'รวมราคาสินค้า', data.totalamountExVat)
        y += rowHeight

        this.drawSummaryRow(y, 'ภาษีมูลค่าเพิ่ม 7%', data.vatamount)
        y += rowHeight

        this.drawSummaryRow(y, 'จำนวนเงินรวมสุทธิ', data.totalamount, true)

        doc.moveDown(1)
        this.SignBill()
    }

    getUnit(subsku) {
        const units = {
            PCS: 'ชิ้น',
            CTN: 'หีบ',
            BOT: 'ขวด',
            CRT: 'กล่อง',
            BAG: 'ถุง',
            PAC: 'แพ็ค',
            Free: 'ชิ้น',
            JOB: 'งาน'
        }

        return units[subsku] ?? 'หน่วย'
    }

    setWidths(w) {
        this.widths = w
    }

    row(data, startX = 10, startY = this.doc.y) {
        const doc = this.doc
        const lineHeight = 6

        // ===== คำนวณจำนวนบรรทัดสูงสุด =====
        let maxLines = 1
        data.forEach((cell, i) => {
            const w = this.widths[i]
            if (typeof cell === 'string') {
                const height = doc.heightOfString(cell, { width: w })
                const lines = Math.ceil(height / lineHeight)
                maxLines = Math.max(maxLines, lines)
            }
        })

        const rowHeight = lineHeight * maxLines

        // ===== Page break =====
        if (startY + rowHeight > doc.page.height - 30) {
            doc.addPage()
            startY = 40
        }

        // ===== วาดแต่ละ cell =====
        let x = startX
        const y = startY

        data.forEach((cell, i) => {
            const w = this.widths[i]
            const align = this.aligns?.[i] || 'center'

            // กรอบ
            doc.rect(x, y, w, rowHeight).stroke()

            // ถ้าเป็นรูป
            if (
                typeof cell === 'string' &&
                /\.(jpg|jpeg|png|gif)$/i.test(cell)
            ) {
                doc.image(cell, x + (w - 20) / 2, y + 2, {
                    width: 20
                })

                doc.text(
                    '............................',
                    x,
                    y + rowHeight - 6,
                    { width: w, align: 'center' }
                )
            } else {
                // ข้อความหลายบรรทัด
                doc.text(String(cell), x + 2, y + 2, {
                    width: w - 4,
                    align
                })
            }

            x += w
        })

        // เลื่อน cursor ลง
        doc.y = y + rowHeight
    }

    checkPageBreak(h, marginBottom = 30) {
        const doc = this.doc

        const pageHeight = doc.page.height
        const currentY = doc.y

        if (currentY + h > pageHeight - marginBottom) {
            doc.addPage()
            doc.y = 40 // เหมือน FPDF หลัง AddPage
        }
    }
}


const doc = new PDFDocument({
  size: 'A5',
  layout: 'portrait',
  margin: 10
})

// output
doc.pipe(fs.createWriteStream('output.pdf'))

// ลงทะเบียน font (แทน AddFont)
doc.registerFont(
  'THSarabunNew',
  './fonts/THSarabunNew.ttf'
)

doc.registerFont(
  'THSarabunNew-Bold',
  './fonts/THSarabunNew-Bold.ttf'
)
