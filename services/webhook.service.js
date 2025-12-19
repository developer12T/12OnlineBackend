const orderModel = require('../model/order')
const productModel = require('../model/product')
const { getModelsByChannel } = require('../authen/middleware/channel')
const axios = require('axios')
const _ = require('lodash');
async function handleOrderCreated(data) {
  // 1. เช็คว่า order ซ้ำไหม
  // 2. save ลง DB
  // 3. trigger workflow อื่น
}
exports.handleOrderPaid = async data => {
  const channel = 'uat'
  //   const channel = 'uat'
  const { Order } = getModelsByChannel(channel, null, orderModel)
  const { Product } = getModelsByChannel(channel, null, productModel)
  if (!data || data.paymentstatus !== 'Paid') {
    console.log('[Webhook] paymentstatus not Paid → skip')
    return
  }

  const orderId = String(data.id)
  const orderNumber = data.number

  if (!orderId || !orderNumber) {
    throw new Error('Invalid webhook payload: missing id or number')
  }

  // 1️⃣ หา order เดิม
  let order = await Order.findOne({ id: orderId })

  // 2️⃣ map list → listProduct
  const listProduct = Array.isArray(data.list)
    ? data.list.map(item => ({
      itemNumber: item.itemNumber,
      id: item.id ? Number(item.id) : data.id,
      productid: item.productid,
      procode: item.proCode || '',
      sku: item.sku,
      itemCode: item.itemCode,
      unit: item.unit,
      name: item.name,
      quantity: item.quantity,
      discount: item.discount || 0,
      discountChanel: item.discountChanel || '',
      pricePerUnitOri: item.pricePerUnitOri ?? item.pricePerUnit,
      pricePerUnit: item.pricePerUnit,
      totalprice: item.totalprice
    }))
    : []

  // 3️⃣ ถ้าไม่เจอ → สร้างใหม่ (Paid มาก่อน Created)
  if (!order) {
    await Order.updateOne(
      { id: orderId },
      {
        $setOnInsert: {
          id: orderId,
          ...data,
          listProduct
        }
      },
      { upsert: true }
    )
    console.log(`[Webhook] Order ${orderNumber} created (Paid)`)
    return
  }

  // 4️⃣ กันยิงซ้ำ
  // if (order.paymentstatus === 'Paid') {
  //   console.log(`[Webhook] Order ${orderNumber} already Paid → skip`)
  //   return
  // }





  if (
    (data.saleschannel === 'Lazada' && (data.shippingamount - data.discountamount) !== 0) ||
    ((data.saleschannel === 'Shopee' || data.saleschannel === 'Shopee Termtip' || data.saleschannel === 'TIKTOK') && data.shippingamount > 0)
  ) {
    const shippingSku = 'ZNS1401001_JOB';
    const shippingProductId = 9999999;
    const shipping = {
      id: data.id,
      numberOrder: data.number,
      productid: shippingProductId,
      procode: '',
      itemCode: shippingSku,
      sku: shippingSku,
      unit: 'JOB',
      name: 'ค่าขนส่ง',
      quantity: 1,
      discount: 0,
      discountChanel: '',
      pricePerUnitOri: data.shippingamount,
      pricePerUnit: data.shippingamount,
      totalprice: data.shippingamount,
    }
    listProduct.push(shipping)
  }


  // let mergedData = {};

  // data.list.forEach(item => {
  //   const multiplier = Number(item?.sku?.split?.('_')?.[2]) || 1
  //   // console.log("multiplier", multiplier)
  //   const adjustedPrice =
  //     multiplier > 1
  //       ? Math.floor(item.pricepernumber / multiplier)
  //       : Math.floor(item.pricepernumber); // ✅ ensure integer
  //   // const key = `${item.productid}`;
  //   // const key = `${item.productid}_${item.sku}`;
  //   const key = `${item.productid}_${item.sku}_${item.pricepernumber}_${item.discount}`;
  //   if (!mergedData[key]) {
  //     mergedData[key] = {
  //       ...item,
  //       number: item.number * multiplier,
  //       pricepernumber: adjustedPrice
  //     };
  //   } else {
  //     mergedData[key].number += item.number * multiplier;
  //     mergedData[key].discountamount += item.discountamount;
  //     mergedData[key].pricePerUnitOri += item.pricePerUnitOri;
  //     mergedData[key].pricepernumber_pretax += item.pricepernumber_pretax;
  //     mergedData[key].pricepernumber_vat += item.pricepernumber_vat;
  //     mergedData[key].totalprice += item.totalprice;
  //   }
  // });
  // let mergedList = Object.values(mergedData);


  // const productIds = mergedList.map(i => Number(i.productid));

  // const products = await Product.find({
  //   id: { $in: productIds }
  // });

  // const productMap = _.keyBy(products, 'id');

  // for (const item of mergedList) {
  //   const multiplier = Number(item?.sku?.split?.('_')?.[2]) || 1;
  //   const product = productMap[Number(item.productid)];

    
  //   if (product) {
  //     console.log('product.sellprice',product.sellprice)
  //     item.originalTotalPrice = (product.sellprice * item.number) / multiplier;
  //     item.originalPricePerNumber = product.sellprice / multiplier;

  //     const sentPrice = Number(item.totalprice) || 0;
  //     item.diff = item.originalTotalPrice - sentPrice;
  //   }
  // }




  // // รวมราคาที่ส่งมา
  // const totalAmount = mergedList.reduce(
  //   (sum, item) => sum + (Number(item.totalprice) || 0),
  //   0
  // );

  // // รวมราคาต้นตั้ง (original)
  // const totalAmountOri = mergedList.reduce(
  //   (sum, item) => sum + (Number(item.originalTotalPrice) || 0),
  //   0
  // );

  // // หาส่วนต่างรวม
  // const diffSummary = totalAmountOri - totalAmount;

  // // console.log('totalAmountOri',totalAmountOri)
  // // console.log('totalAmount',totalAmount)
  // console.log('totalAmountOri',totalAmountOri)
  // console.log('totalAmount',totalAmount)
  // if (diffSummary > 0) {
  //   const itemDisOnline = await axios.post(process.env.API_URL + '/M3API/ItemManage/Item/getItemDisOnline', {
  //     itemtype: 'ZNS',
  //     itemcode: 'DISONLINE',
  //     companycode: 410,
  //   }, {});

  //   const disonline = {
  //     id: data.id,
  //     numberOrder: data.number,
  //     productid: 8888888, //disonline
  //     procode: '',
  //     itemCode: itemDisOnline.data[0].itemcode.trim() + '_PCS',
  //     sku: itemDisOnline.data[0].itemcode.trim() + '_PCS',
  //     unit: 'PCS',
  //     name: itemDisOnline.data[0].itemname,
  //     quantity: 1,
  //     discount: 0,
  //     discountChanel: '',
  //     pricePerUnitOri: 0,
  //     pricePerUnit: 0,
  //     totalprice: data.sellerdiscount
  //   }
  //   listProduct.push(disonline)
  //   // console.log('disonline',disonline)
  // }


  // 5️⃣ update order เดิม
  order.paymentstatus = 'Paid'
  order.status = data.status || order.status
  order.updatedatetime = data.updatedatetime
  order.updatedatetimeString = data.updatedatetimeString
  order.amount = data.amount
  order.vatamount = data.vatamount
  order.totalproductamount = data.totalproductamount || data.amount
  order.currency = data.currency
  order.listProduct = listProduct

  await order.save()
  // console.log(order.listProduct)



  console.log(`[Webhook] Order ${orderNumber} marked as Paid`)
}

async function handleOrderCancelled(data) {
  // rollback / mark cancelled
}
