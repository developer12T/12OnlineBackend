const printService = require('../services/print.service')
const generateReceiptOriginal = require('../pdf/receipt.original')
const generateReceiptOriginalAndCopy = require('../pdf/receipt.original.andcopy')
const generateReceiptCopy = require('../pdf/receipt.copy')

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

exports.printReceiptOriginal2 = async (req, res) => {
  try {
    const checklistRaw = req.body.checklist
    const checklist = Array.isArray(checklistRaw)
      ? checklistRaw
      : JSON.parse(checklistRaw)

    if (!Array.isArray(checklist) || checklist.length === 0) {
      return res.status(400).end()
    }

    // 🔥 PREPARE (หนัก แต่ทำครั้งเดียว)
    await printService.prepareOrdersForPrint(checklist)

    // 🔥 PRINT (เบา)
    const orders = await printService.getOrdersForPrint2(checklist)

    return generateReceiptOriginal(res, orders)
  } catch (error) {
    console.error('printReceiptOriginal error:', error)
    if (!res.headersSent && !res.writableEnded) res.status(500).end()
  }
}

exports.printReceiptOriginalNotUpdate = async (req, res) => {
  try {
    const checklistRaw = req.body.checklist
    const checklist = Array.isArray(checklistRaw)
      ? checklistRaw
      : JSON.parse(checklistRaw)

    if (!Array.isArray(checklist) || checklist.length === 0) {
      return res.status(400).end()
    }
    const orders = await printService.getOrdersForPrintCopy(checklist)
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

exports.printReceiptCopy = async (req, res) => {
  try {
    const checklistRaw = req.body.checklist
    const checklist = Array.isArray(checklistRaw)
      ? checklistRaw
      : JSON.parse(checklistRaw)

    if (!Array.isArray(checklist) || checklist.length === 0) {
      return res.status(400).end()
    }
    const orders = await printService.getOrdersForPrintCopy(checklist)
    if (!orders?.length) {
      return res.status(404).end()
    }

    return generateReceiptCopy(res, orders)
  } catch (error) {
    console.error('printReceiptOriginal error:', error)

    if (!res.headersSent && !res.writableEnded) {
      res.status(500).end()
    }
  }
}

exports.printReceiptOriginalAndCopy = async (req, res) => {
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

    return generateReceiptOriginalAndCopy(res, orders)
  } catch (error) {
    console.error('printReceiptOriginal error:', error)

    if (!res.headersSent && !res.writableEnded) {
      res.status(500).end()
    }
  }
}
