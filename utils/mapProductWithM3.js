const express = require('express')

async function mapProductWithM3 (orderLines = [], ItemM3) {
  // 1. ดึง itemCodes (unique)
  const itemCodes = [
    ...new Set(
      orderLines
        .map(l => l.product_shop_sku?.split('_')[0])
        .map(v => String(v).trim())
        .filter(Boolean)
    )
  ]

  if (!itemCodes.length) return []

  // 2. ดึงข้อมูลจาก M3
  const itemsM3 = await ItemM3.findAll({
    attributes: ['MMITNO', 'MMFUDS', 'MMITDS'],
    where: {
      MMCONO: 410,
      MMITNO: itemCodes
    },
    raw: true
  })

  // 3. ทำ map
  const itemM3Map = {}
  for (const m of itemsM3) {
    const itno = String(m.MMITNO).trim()
    itemM3Map[itno] = {
      nameShort: m.MMFUDS || '',
      nameFull: m.MMITDS || ''
    }
  }

  // 4. map order_lines → listProduct
  return orderLines.map(line => {
    const [code, suffix] = line.product_shop_sku.split('_')
    const m3 = itemM3Map[code] || {}

    return {
      itemNumber: line.line_number || 1,
      productid: line.offer_id,
      procode: line.procode || '',
      sku: line.product_shop_sku,
      itemCode: code,
      unit: suffix || '',
      name: line.product_title,

      // ⭐ จาก M3
      nameM3: m3.nameShort || '', // MMFUDS
      nameM3Full: m3.nameFull || '', // MMITDS

      quantity: line.quantity,
      discount: 0,
      discountChanel: '',
      pricePerUnitOri: line.price_unit,
      pricePerUnit: line.price_unit,
      totalprice: line.total_price
    }
  })
}

module.exports = mapProductWithM3
