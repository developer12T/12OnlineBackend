const printService = require('../services/print.service')
const generateReceiptOriginal = require('../pdf/receipt.original')

exports.printReceiptOriginal = async (req, res) => {
  try {
    const checklistRaw = req.body.checklist
    const checklist = Array.isArray(checklistRaw)
      ? checklistRaw
      : JSON.parse(checklistRaw)

    if (!Array.isArray(checklist) || checklist.length === 0) {
      return res.status(400).end()
    }



    const orders = await printService.getOrdersForPrint(checklist)

    if (!orders?.length) {
      return res.status(404).end()
    }

    return generateReceiptOriginal(res, orders)
  } catch (error) {
    console.error('printReceiptOriginal error:', error)

    if (!res.headersSent && !res.writableEnded) {
      res.status(500).end()
    }
  }
}
