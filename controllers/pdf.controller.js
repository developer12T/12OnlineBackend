const fs = require('fs')
const axios = require('axios')
const PDFDocument = require('pdfkit')
const { getDataPrintReceipt } = require('../middleware/erpAndM3')
// ===============================
// helper: call API
// ===============================
async function fetchDataFromAPI(url, data) {
  const res = await axios.post(url, data, {
    headers: { 'Content-Type': 'application/json' }
  })
  return res.data
}

// ===============================
// helper: Thai Baht text
// ===============================
function thaiNumberToWords(amount) {
  const values = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
  const places = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']

  function convert(num) {
    let output = ''
    const s = String(num).split('').reverse()
    s.forEach((n, i) => {
      if (i % 6 === 0 && i > 0) output = 'ล้าน' + output
      if (n !== '0') output = values[n] + places[i % 6] + output
    })
    return output
      .replace('หนึ่งสิบ', 'สิบ')
      .replace('สองสิบ', 'ยี่สิบ')
      .replace('สิบหนึ่ง', 'สิบเอ็ด')
  }

  const [i, f] = Math.abs(amount).toFixed(2).split('.')
  const baht = convert(i)
  const satang = convert(f)

  if (!baht && !satang) return 'ศูนย์บาทถ้วน'
  return (
    (amount < 0 ? 'ลบ' : '') +
    (baht ? baht + 'บาท' : '') +
    (satang ? satang + 'สตางค์' : 'ถ้วน')
  )
}

// ===============================
// main PDF logic
// ===============================
async function generatePDF(checklist) {
  const doc = new PDFDocument({ size: 'A5', margin: 20 })
  doc.pipe(fs.createWriteStream('invoice.pdf'))

  // Thai font
  doc.registerFont('TH', '../12OnlineBackend/controllers/THSarabunNew.ttf')
  doc.font('TH')

  for (let i = 0; i < checklist.length; i++) {

    const res = await getDataPrintReceipt({
      list: checklist[i],
      action: 'lastRowActionToDataErp'
    })

    const data = Array.isArray(res) ? res[0] : res

    // 🔁 ต้นฉบับ + สำเนา
    for (const copyType of ['ต้นฉบับ', 'สำเนา']) {
      doc.addPage()
      header(doc, copyType)
      customerSection(doc, data)
      table(doc, data)
      summary(doc, data)
      sign(doc)
    }
  }

  doc.end()
}

// ===============================
// sections
// ===============================
function header(doc, copyType) {
  doc
    .fontSize(14)
    .text('บริษัท วันทูเทรดดิ้ง จำกัด', { align: 'left' })
    .fontSize(12)
    .text('58/3 หมู่ที่ 6 ถ.พระประโทน-บ้านแพ้ว ต.ตลาดจินดา')
    .text('อ.สามพราน จ.นครปฐม 73110')
    .moveDown(0.5)
    .fontSize(14)
    .text(`${copyType}บิลเงินสด / ใบกำกับภาษี`, { align: 'right' })
    .moveDown()
}

function customerSection(doc, d) {
  doc
    .fontSize(12)
    .text(`รหัสลูกค้า: ${d.customer.customercode}`)
    .text(`ชื่อลูกค้า: ${d.customer.customername}`)
    .text(`เลขที่เอกสาร: ${d.invno}`)
    .text(`วันที่: ${d.updatedatetime}`)
    .moveDown()
}

function table(doc, d) {
  doc.fontSize(11)
  doc.text('ลำดับ  รายการสินค้า                    จำนวน   หน่วย   ราคา   รวม')
  doc.moveDown(0.3)

  d.list.forEach((it, i) => {
    // console.log('it',it)
    doc.text(
      `${i + 1}. ${it.name}  ${it.number}  ${it.sku.split('_')[1]}  ${it.pricePerUnit.toFixed(2)}  ${it.totalprice.toFixed(2)}`
    )
  })

  doc.moveDown()
}

function summary(doc, d) {
  doc
    .fontSize(12)
    .text(`(${thaiNumberToWords(d.totalamount)})`)
    .moveDown(0.3)
    .text(`รวมก่อน VAT: ${d.totalamountExVat.toFixed(2)}`)
    .text(`VAT 7%: ${d.vatamount.toFixed(2)}`)
    .text(`รวมสุทธิ: ${d.totalamount.toFixed(2)}`)
    .moveDown()
}

function sign(doc) {
  doc
    .text('ผู้รับของ .................    ผู้ส่งของ .................')
    .text('ผู้ตรวจสอบ .................  ผู้รับเงิน .................')
}

// ===============================
// run
// ===============================
const checklist = ['13803516']
generatePDF(checklist)


module.exports = {
  generatePDF
}
