const express = require('express');
const getDataPrintReceipt = express.Router();
const { Op } = require('sequelize');
const { Order, OrderDetail, OrderHis, OrderDetailHis } = require('../model/Order')
const { Customer, ShippingAddress } = require('../model/Customer')
const { logTable } = require('../model/Logtable')
const sequelize = require('sequelize')
const axios = require('axios')
const moment = require('moment');
const { isNull } = require('lodash');
require('moment/locale/th');

// function today() {
//   currentDate = moment().utcOffset(7).format('YYYY-MM-DD');
//   currentDate2 = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm');
// }

getDataPrintReceipt.post('/getDataPrintReceipt', async (req, res) => {

  try {

    // setInterval(today, 5000);
    const currentDate = moment().utcOffset(7).format('YYYY-MM-DD');
    const currentDate2 = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm');
    const idOrder = req.body.list

    if (req.body.action == 'UpdateInvoiceOrder') {

      const orderDatup = await Order.findAll({ where: { cono: 1, id: idOrder } })

      // if((orderDatup === null) || (orderDatup === undefined) || (orderDatup === '')){
      if ((orderDatup <= 0)) {
        console.log('empty')
      } else {

        var countUpdateorder = 0
        for (let i = 0; i < orderDatup.length; i++) {
          var numberser = await axios.post('http://192.168.2.97:8383/M3API/OrderManage/Order/getNumberSeries', {
            series: 'ง',
            seriestype: '01',
            companycode: 410,
            seriesname: '071'
          }, {});
          var invser = await axios.post(process.env.API_URL + '/M3API/OrderManage/Order/getInvNumber', {
            ordertype: '071'
          }, {});
          var invm3 = parseInt(invser.data[0].customerordno)
          const inv12T = await Order.findAll({ attributes: ['invno'], limit: 1, order: [['invno', 'DESC']], })
          //   console.log(inv12T[0].invno);
          var inv12tcon = parseInt(inv12T[0].invno)
          if (invm3 > inv12tcon) {
            var inNo = (parseInt(invser.data[0].customerordno));
            var invnumber = inNo + 1;
          } else {
            var inNo = (inv12tcon + 1);
            var invnumber = inNo;
          }
          if (i == 0) {
            var seNo = (numberser.data[0].lastno + 1);
          } else {
            var seNo = (numberser.data[0].lastno + i);
          }
          var lastnumber = seNo;
          console.log(lastnumber)
          const updateRun = await Order.update({ cono: lastnumber, invno: invnumber, updatedatetime: currentDate }, { where: { id: orderDatup[i].id } })
          await logTable.create({ number: orderDatup[i].number, action: `run Inv : ${invnumber}`, action1: `run Co : ${lastnumber}`, createdAt: currentDate })
          countUpdateorder = i
        }

        console.log(countUpdateorder)

        var numberser2 = await axios.post('http://192.168.2.97:8383/M3API/OrderManage/Order/getNumberSeries', {
          series: 'ง',
          seriestype: '01',
          companycode: 410,
          seriesname: '071'
        }, {});

        var updateNumber = await axios.post(process.env.API_URL + '/M3API/OrderManage/Order/updateNumberRunning', {
          series: 'ง',
          seriestype: '01',
          companycode: 410,
          seriesname: '071',
          lastno: numberser2.data[0].lastno + countUpdateorder + 1
        }, {});
        console.log('no emptyp')
      }
      res.json(orderDatup)
    } else {


      const data = await Order.findAll({
        attributes: ['id', 'cono', 'invno', 'number', 'amount', 'totalproductamount', 'vatamount', 'shippingamount', 'orderdateString', 'updatedatetime', 'discount', 'platformdiscount', 'sellerdiscount', 'shippingdiscount', 'discountamount', 'voucheramount', 'saleschannel', 'statusprintinv'],
        where: {
          id: idOrder
        },
        include: [
          {
            model: Customer,
            required: false,
            attributes: ['customercode','customername', 'customeraddress', 'customeridnumber'],
          },
          {
            model: OrderDetail,
            required: false,
            attributes: ['productid', 'name', 'number', 'pricepernumber', 'totalprice', 'sku', 'discount', 'discountamount'],
            separate: false,
          },
          {
            model: ShippingAddress,
            required: false,
            attributes: ['shippingaddress', 'shippingpostcode'],
            separate: false,
          }
        ],
      });
      const totalprint = await Order.findAll({ attributes: ['totalprint', 'statusprint', 'statusPrininvSuccess', 'statusprintinv'], where: { id: idOrder } })
      var ci = totalprint[0].totalprint + 1
      if (totalprint[0].statusprint == '000') {
        var st = '001'
      } else if (totalprint[0].statusprint == '001') {
        var st = '002'
      }

      if (totalprint[0].statusprintinv == 'TaxInvoice') {
        if (totalprint[0].statusPrininvSuccess == '000') {
          var st = '001'
        } else if (totalprint[0].statusPrininvSuccess == '001') {
          var st = '002'
        }

        if (st === '002') {
          await Order.update({ statusPrininvSuccess: st, totalprint: ci }, {
            where: {
              id: idOrder, status: {
                [Op.not]: 'Voided'
              }
            }
          })
        } else {
          await Order.update({ statusPrininvSuccess: st, totalprint: ci, updatedatetime: currentDate, updatedatetimeString: currentDate2 }, {
            where: {
              id: idOrder, status: {
                [Op.not]: 'Voided'
              }
            }
          })
        }


      } else {
        if (st === '002') {
          await Order.update({ statusprint: st, totalprint: ci }, {
            where: {
              id: idOrder, status: {
                [Op.not]: 'Voided'
              }
            }
          })
        } else {
          await Order.update({ statusprint: st, totalprint: ci, updatedatetime: currentDate, updatedatetimeString: currentDate2 }, {
            where: {
              id: idOrder, status: {
                [Op.not]: 'Voided'
              }
            }
          })
        }

      }
      if (req.body.action == 'lastRowActionToDataErp') {
        const response = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/addOrderErp');
        console.log('ERP Response:', response.data);

        // const response = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/addOrderErp', {}, {});
      }
      //console.log('1 :::::::' + data[0].orderDetails[0].name);

      // TR closed 
      // for (let i = 0; i < data[0].orderDetails.length; i++) {
      //   console.log('2 :::::::' + data[0].orderDetails[i].sku.split('_')[0]);
      //   var namem3 = await axios.post(process.env.API_URL + '/M3API/ItemManage/Item/getItem', {
      //     itemcode: `${data[0].orderDetails[i].sku.split('_')[0]}`
      //   })

      //   data[0].orderDetails[i].name = namem3.data[0].itemname;

      // }
      let itemdiscount = 0;
      for (let order of data) {
        const disDetail = order.orderDetails.find(detail => detail.productid === 8888888);
        if (disDetail) {
          itemdiscount = disDetail.pricepernumber;
        }
        for (let detail of order.orderDetails) {
          if (detail.productid !== 8888888) {
            const [sku, flag] = detail.sku.split('_');
          if (flag === "Free") {
            const sku = detail.sku.split('_')[0];
            const item = await axios.post(process.env.API_URL + '/M3API/ItemManage/Item/getItem', {
              itemcode: sku
            });
            detail.name = '(สินค้าโปรโมชั่นแจกฟรี) '+item.data[0].itemname;

          }else{
            const sku = detail.sku.split('_')[0];
            const item = await axios.post(process.env.API_URL + '/M3API/ItemManage/Item/getItem', {
              itemcode: sku
            });
            detail.name = item.data[0].itemname;
          }
           
          }
        }
      }
      const listBuy = data[0].orderDetails.filter(detail => detail.productid !== 8888888)
      listBuy.sort((a, b) => b.productid - a.productid)
      const resdata = [{
        id: data[0].id,
        cono: data[0].cono,
        invno: data[0].invno,
        number: data[0].number,
        totalamount: data[0].amount,
        totalamountExVat: parseFloat(data[0].amount)-parseFloat(data[0].vatamount),
        productamount: parseInt(data[0].totalproductamount)+parseInt(data[0].shippingamount),
        discount: itemdiscount,
        vatamount: data[0].vatamount,
        shippingamount: data[0].shippingamount,
        updatedatetime: data[0].updatedatetime,
        channel: data[0].saleschannel,
        printinv: data[0].statusprintinv,
        list:listBuy,
        customer: data[0].customer,
        address: data[0].shippingAddress,
      }]
      console.log(resdata);
      res.json(resdata);


      res.json(data)
    }

  } catch (error) {
    console.log(error)
    res.json('error invalid data')
  }
});

getDataPrintReceipt.post('/getDataPrintReceiptRepair', async (req, res) => {

  try {
    const currentDate = moment().utcOffset(7).format('YYYY-MM-DD');
    const currentDate2 = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm');
    const idOrder = req.body.list

    const data = await OrderHis.findAll({
      attributes: ['id', 'cono', 'invno', 'number', 'amount', 'totalproductamount', 'vatamount', 'shippingamount', 'orderdateString', 'updatedatetime', 'discount', 'platformdiscount', 'sellerdiscount', 'shippingdiscount', 'discountamount', 'voucheramount', 'saleschannel', 'statusprintinv'],
      where: {
        id: idOrder
      },
      include: [
        {
          model: Customer,
          required: false,
          attributes: ['customername', 'customeraddress', 'customeridnumber'],
        },
        {
          model: OrderDetailHis,
          required: false,
          attributes: ['productid', 'name', 'number', 'pricepernumber', 'totalprice', 'sku', 'discount', 'discountamount'],
          separate: false,
        },
        {
          model: ShippingAddress,
          required: false,
          attributes: ['shippingaddress', 'shippingpostcode'],
          separate: false,
        }
      ],
    });

    //  for(const list of data[0].orderDetailSuccessInsM3s){
    for (let i = 0; i < data[0].orderDetailSuccessInsM3s.length; i++) {
      console.log(data[0].orderDetailSuccessInsM3s[i].sku.split('_')[0]);
      var namem3 = await axios.post(process.env.API_URL + '/M3API/ItemManage/Item/getItem', {
        itemcode: `${data[0].orderDetailSuccessInsM3s[i].sku.split('_')[0]}`
      })

      data[0].orderDetailSuccessInsM3s[i].name = namem3.data[0].itemname;
      // if(namem3.data[0].itemcode.trim() === list){

      // }else{

      // }
      // const matchingOrderDetail = data[0].orderDetailSuccessInsM3s.find(detail => detail.sku.split('_')[0] === namem3.data[0].itemcode.trim());
      // if (matchingOrderDetail) {
      //   console.log('aaaaa : '+namem3.data[0].itemcode+'LLLL') 
      //     matchingOrderDetail.name = namem3.data[0].itemname;
      // }

    }

    res.json(data)


    //     
  } catch (error) {
    console.log(error)
    res.json(error)
  }
});

getDataPrintReceipt.post('/getDataPrintReceiptErp', async (req, res) => {
  try {
    const idOrder = req.body.list;
    const data = await OrderHis.findAll({
      attributes: ['id', 'cono', 'invno', 'number', 'amount', 'totalproductamount', 'vatamount', 'shippingamount', 'orderdateString', 'updatedatetime', 'saleschannel', 'statusprintinv'],
      where: {
        id: idOrder
      },
      include: [
        {
          model: Customer,
          required: false,
          attributes: ['customercode','customername', 'customeraddress', 'customeridnumber'],
        },
        {
          model: OrderDetailHis,
          required: false,
          attributes: ['productid', 'name', 'number', 'pricepernumber', 'totalprice', 'sku', 'discount', 'discountamount'],
        },
        {
          model: ShippingAddress,
          required: false,
          attributes: ['shippingaddress', 'shippingpostcode'],
        }
      ],
    });
    let itemdiscount = 0;
    for (let order of data) {
      const disDetail = order.orderDetailSuccessInsM3s.find(detail => detail.productid === 8888888);
      if (disDetail) {
        itemdiscount = disDetail.pricepernumber;
      }
      for (let detail of order.orderDetailSuccessInsM3s) {
        if (detail.productid !== 8888888) {

            const [sku, flag] = detail.sku.split('_');
          if (flag === "Free") {
            const sku = detail.sku.split('_')[0];
            const item = await axios.post(process.env.API_URL + '/M3API/ItemManage/Item/getItem', {
              itemcode: sku
            });
            detail.name = '(สินค้าโปรโมชั่นแจกฟรี) '+item.data[0].itemname;

          }else{
            const sku = detail.sku.split('_')[0];
            const item = await axios.post(process.env.API_URL + '/M3API/ItemManage/Item/getItem', {
              itemcode: sku
            });
            detail.name = item.data[0].itemname;
          }

        }
      }
    }
    const listBuy = data[0].orderDetailSuccessInsM3s.filter(detail => detail.productid !== 8888888)
    listBuy.sort((a, b) => b.productid - a.productid)
    const resdata = [{
      id: data[0].id,
      cono: data[0].cono,
      invno: data[0].invno,
      number: data[0].number,
      totalamount: data[0].amount,
      totalamountExVat: parseFloat(data[0].amount)-parseFloat(data[0].vatamount),
      productamount: parseInt(data[0].totalproductamount)+parseInt(data[0].shippingamount),
      discount: itemdiscount,
      vatamount: data[0].vatamount,
      shippingamount: data[0].shippingamount,
      updatedatetime: data[0].updatedatetime,
      channel: data[0].saleschannel,
      printinv: data[0].statusprintinv,
      list:listBuy,
      customer: data[0].customer,
      address: data[0].shippingAddress,
    }]
    console.log(resdata);
    res.json(resdata);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

getDataPrintReceipt.post('/getDataPrintReceiptSuccess', async (req, res) => {
  try {
    const idOrder = req.body.list;
    const data = await Order.findAll({
      attributes: ['id', 'cono', 'invno', 'number', 'amount', 'totalproductamount', 'vatamount', 'shippingamount', 'orderdateString', 'updatedatetime', 'saleschannel', 'statusprintinv'],
      where: {
        id: idOrder
      },
      include: [
        {
          model: Customer,
          required: false,
          attributes: ['customercode','customername', 'customeraddress', 'customeridnumber'],
        },
        {
          model: OrderDetail,
          required: false,
          attributes: ['productid', 'name', 'number', 'pricepernumber', 'totalprice', 'sku', 'discount', 'discountamount'],
        },
        {
          model: ShippingAddress,
          required: false,
          attributes: ['shippingaddress', 'shippingpostcode'],
        }
      ],
    });
    let itemdiscount = 0;
    for (let order of data) {
      const disDetail = order.orderDetails.find(detail => detail.productid === 8888888);
      if (disDetail) {
        itemdiscount = disDetail.pricepernumber;
      }
      for (let detail of order.orderDetails) {
        if (detail.productid !== 8888888) {
          const [sku, flag] = detail.sku.split('_');
          if (flag === "Free") {
            const sku = detail.sku.split('_')[0];
            const item = await axios.post(process.env.API_URL + '/M3API/ItemManage/Item/getItem', {
              itemcode: sku
            });
            detail.name = '(สินค้าโปรโมชั่นแจกฟรี) '+item.data[0].itemname;

          }else{
            const sku = detail.sku.split('_')[0];
            const item = await axios.post(process.env.API_URL + '/M3API/ItemManage/Item/getItem', {
              itemcode: sku
            });
            detail.name = item.data[0].itemname;
          }
        }
      }
    }
    const listBuy = data[0].orderDetails.filter(detail => detail.productid !== 8888888)
    listBuy.sort((a, b) => b.productid - a.productid)
    const resdata = [{
      id: data[0].id,
      cono: data[0].cono,
      invno: data[0].invno,
      number: data[0].number,
      totalamount: data[0].amount,
      totalamountExVat: parseFloat(data[0].amount)-parseFloat(data[0].vatamount),
      productamount: parseInt(data[0].totalproductamount)+parseInt(data[0].shippingamount),
      discount: itemdiscount,
      vatamount: data[0].vatamount,
      shippingamount: data[0].shippingamount,
      updatedatetime: data[0].updatedatetime,
      channel: data[0].saleschannel,
      printinv: data[0].statusprintinv,
      list:listBuy,
      customer: data[0].customer,
      address: data[0].shippingAddress,
    }]
    console.log(resdata);
    res.json(resdata);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

module.exports = getDataPrintReceipt;    