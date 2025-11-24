
const express = require('express');
const moment = require('moment');
const { Op, where } = require('sequelize');
const axios = require('axios')
const { Sequelize,DataTypes,QueryTypes } = require('sequelize');
const cusStock = express.Router();

// const orderDataZort = require('../dataZort/allOrder');

const { Order, OrderDetail,OrderHis } = require('../../model/Order') ;
const { Customer,ShippingAddress } = require('../../model/Customer') ;
const { orderMovement } = require('../../model/Ordermovement') ;
const { Product } = require('../../model/Product');
const { log } = require('console');

require('moment/locale/th');
const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm');

cusStock.post('/cusStock', async (req, res) => {
  const headers = {
    storename: process.env.zortstorename,
    apikey:  process.env.zortapikey,
    apisecret:  process.env.zortapisecret,
};
try {
  const cutter = [] 
  const allStock = [] ;
  const bodycut = [] 
   const orderMoment = await orderMovement.findAll({where:{statusStock:'0'}})
   for(const orderId of orderMoment ){
    const items = await OrderDetail.findAll({attributes:['productid','sku','number'],where:{id:orderId.id,sku:{
      [Op.not]:['DISONLINE_PCS','ZNS1401001_JOB']
    }}})


    const skuMap = new Map();

    for (const item of items) {

      if(item.productid === undefined){

      }else{
          // ดึงข้อมูลจาก zort มาอัพเดตก่อน
          const preCutStorck = await  axios.get(`https://open-api.zortout.com/v4/Product/GetProductDetail?id=${item.productid}`,{headers:headers})
          await Product.update({availablestock:preCutStorck.data.availablestock,stock:preCutStorck.data.stock},{where:{sku:item.sku}})
          //end

          const normalizedSku = item.sku.toLowerCase();
          if (!skuMap.has(normalizedSku)) {
            skuMap.set(normalizedSku, { sku: item.sku, number: item.number });
          } else {
            skuMap.get(normalizedSku).number += item.number;
          }
      }
    }
    
    // แปลงผลลัพธ์จาก Map เป็นรูปแบบที่คุณต้องการ
    const result = Array.from(skuMap.values());

    log(result)

    for(const listofdetail of result){
      //  console.log(listofdetail.sku+' : '+listofdetail.number);
      if(listofdetail.productid === undefined){

      }else{
      const preCutStorckcondition = await  axios.get(`https://open-api.zortout.com/v4/Product/GetProductDetail?id=${listofdetail.productid}`,{headers:headers})
        if(preCutStorckcondition.data.active === false){
            await Product.update({active:0},{where:{sku:listofdetail.sku}})
        }else{

            const itcode = listofdetail.sku
            var itcodeOnly = itcode.split('_')[0];
            var itskuOnly = itcode.split('_')[1];
       
      
            if((itskuOnly === 'PCS')||(itskuOnly === 'BOT')){
              console.log('ตัวที่จะเอามาตัด เป็น PCS');
      
              const stock12T = await Product.findAll({
                attributes:['id','sku','availablestock'],
                where:{
                  sku:itcode
                }
              })
      
      
              console.log('จำนวน PCS ใน 12T : '+stock12T[0].availablestock); 
              var pcsUnit = stock12T[0].availablestock 
      
      
      
               const stock12TT = await Product.findAll({
                  attributes:['sku','availablestock'],
                  where:{
                    sku:{
                      [Op.like]:`%${itcodeOnly}%`
                    }
                  }
                })
      
                for(const converType of stock12TT ){
                  const response = await axios.post(process.env.API_URL+'/M3API/ItemManage/Item/getItemConvertItemcode',{ itcode:itcodeOnly }, {});
                  const restdata = response.data[0].type ;
                  // log(converType.sku)
                  // log(restdata)
                  for(const typecon of restdata){
                    log(converType.sku.split('_')[1] +'==='+ typecon.unit)
                    if(converType.sku.split('_')[1] === typecon.unit){
                   
                     log(pcsUnit)
                       var stockTerm = Math.floor((pcsUnit-listofdetail.number)/typecon.factor) 
                       log('test float to int ::::::'+parseInt(stockTerm))
      
                     
                      
      
                      const updateStock = await Product.update({availablestock:stockTerm},{where:{sku:converType.sku}})
                      
                      var stocks = [ 
                        {
                          "sku": converType.sku,
                          "stock": stockTerm,
                        //   "cost": 999
                        }
                      ]
      
                      const response =  axios.post('https://open-api.zortout.com/v4/Product/UpdateProductAvailableStockList?warehousecode=W0001', {stocks}, {headers: headers,})
      
                    }else if((converType.sku.split('_')[1] === 'PCS') || (converType.sku.split('_')[1] === 'BOT')){
                      log(pcsUnit)
                      var stockTerm = (pcsUnit-listofdetail.number)
                      const updateStock = await Product.update({availablestock:stockTerm},{where:{sku:converType.sku}})
      
                      var stocks = [
                            {
                              "sku": converType.sku,
                              "stock": stockTerm,
                            //   "cost": 999
                            } 
                          ]
                      const response =  axios.post('https://open-api.zortout.com/v4/Product/UpdateProductAvailableStockList?warehousecode=W0001', {stocks}, {headers: headers,})
                      log(parseInt(stockTerm))
                    }
                    // log(typecon.unit)
                  }
                }
      
            }else{
              console.log('ตัวที่จะเอามาตัด เป็น CTN BAG :' + itcode);
              const response = await axios.post(process.env.API_URL+'/M3API/ItemManage/Item/getItemConvertItemcode',{ itcode:itcodeOnly }, {});
              const restdata = response.data[0].type ;
      
              const filteredData = restdata.filter(item => item.unit === itskuOnly);
              const factorsOnly = filteredData.map(item => item.factor);
      
              // console.log(factorsOnly);
      
              var  pcsUnit2 =  factorsOnly*listofdetail.number
      
              const stock12TT = await Product.findAll({
                attributes:['sku','availablestock'],
                where:{
                  sku:{
                    [Op.like]:`%${itcodeOnly}%` 
                  }
                }
              })
      
              for(const converType of stock12TT ){
                const response = await axios.post(process.env.API_URL+'/M3API/ItemManage/Item/getItemConvertItemcode',{ itcode:itcodeOnly }, {});
                const restdata = response.data[0].type ;
                // log(converType.sku)
                // log(restdata)
                for(const typecon of restdata){
                  log(converType.sku.split('_')[1] +'==='+ typecon.unit)
                  if(converType.sku.split('_')[1] === typecon.unit){
                 
                   log(pcsUnit2)
      
                     var stockTerm = (converType.availablestock-(pcsUnit2/typecon.factor))
                      var StockInt = parseInt(stockTerm)
                    const updateStock = await Product.update({availablestock:StockInt},{where:{sku:converType.sku}})
                    var stocks = [
                      {
                        "sku": converType.sku,
                        "stock": StockInt,
                      //   "cost": 999
                      } 
                    ]
                    const response =  axios.post('https://open-api.zortout.com/v4/Product/UpdateProductAvailableStockList?warehousecode=W0001', {stocks}, {headers: headers,});
                  }else if((converType.sku.split('_')[1] === 'PCS') || (converType.sku === 'BOT')){
                    // log(pcsUnit2)
                    var stockTerm = (converType.availablestock-pcsUnit2)
                    const updateStock = await Product.update({availablestock:stockTerm},{where:{sku:converType.sku}})
      
                    var stocks = [
                          {
                            "sku": converType.sku,
                            "stock": stockTerm,
                          //   "cost": 999
                          } 
                        ]
                    const response =  axios.post('https://open-api.zortout.com/v4/Product/UpdateProductAvailableStockList?warehousecode=W0001', {stocks}, {headers: headers,});
                    // log('2 : '+parseInt(stockTerm))
                  }
                  // log(typecon.unit)
                }
              }
            }
      
            // //1. ทำตัวที่ตัด ให้ เป็น หน่วยย่อยที่สุด
            // const response = await axios.post(process.env.API_URL+'/M3API/ItemManage/Item/getItemConvertItemcode',{ itcode:itcodeOnly }, {});
            // const restdata = response.data[0].type ;
            // for(const typecon of restdata){
            //   if(typecon.unit === itskuOnly ){
            //     const cuuters = typecon.factor * listofdetail.number
            //     cutter.push(cuuters)
            //   }else if(itskuOnly === 'PCS' || itcodeOnly === 'BOT'){
            //     var pcsUnit = listofdetail.availablestock
            //     var facto = 1
            //     const cuuters = listofdetail.number
            //     cutter.push(cuuters)
            //   }
            // }
      
            // //2. เอา item ที่จะถูกต้องใน stock มา convert ให้เป็น pcs
            // const stock12T = await Product.findAll({
            //   attributes:['sku','availablestock'],
            //   where:{
            //     sku:{
            //       [Op.like]:`%${itcodeOnly}%`
            //     }
            //   }
            // })
      
            // for(const converType of stock12T ){
      
            //   const response = await axios.post(process.env.API_URL+'/M3API/ItemManage/Item/getItemConvertItemcode',{ itcode:itcodeOnly }, {});
            //   const restdata = response.data[0].type ;
            //   var itskuOnly = converType.sku.split('_')[1];
      
            //   // console.log(converType);
            // //   for(const typecon of restdata){
            // //     if(typecon.unit === itskuOnly ){
      
            // //       var pcsUnit = typecon.factor * converType.availablestock
            // //       var facto =typecon.factor
                  
            // //     }else if(itskuOnly === 'PCS' || itcodeOnly === 'BOT'){
      
            // //       var pcsUnit = converType.availablestock
            // //       var facto = 1
      
            // //     }
      
            // //  }
      
      
            //   const datacon = {
            //     sku:converType.sku,
            //     stock:converType.availablestock,
            //     pcsUnit:pcsUnit,
            //     facto:facto
            //   }
            //   bodycut.push(datacon)
            // }
      
            // for(let i =0;i<bodycut.length;i++){
      
            //   // console.log(`${i} :`+bodycut[i].sku);
            //   // console.log(`${i} :`+bodycut[i].stock);
            //   // console.log(`${i} :`+bodycut[i].pcsUnit);
            //   // console.log(`${i} :`+bodycut[i].facto);
      
              
            //    var cut =bodycut[i].pcsUnit - cutter[0] // อันนี้คือ สต็อกใน 12T  - จำนวนใน order ที่เข้ามา ซึ่งจะเป็นการ แปลงเป็น pcs แล้ว
      
            //    if(cut === NaN){
            //     var stocklast = 0
            //    }else{
            //     var stocklast = cut / bodycut[i].facto
            //    }
            //    // เอาสต็อกที่ตัดแล้ว มา fator เพื่อ convert กลับ ไปเป็น unit ของมัน
            //   //  console.log(`${i} : -`+ cutter[0]);
            //   //  console.log(`${i} : =`+stocklast);
      
            //   const stockTerm =parseInt(stocklast) // error ตรงนี้ ค่า Nan
      
            //   var stocks = [
            //           {
            //             "sku": bodycut[i].sku,
            //             "stock": stockTerm,
            //           //   "cost": 999
            //           }
            //         ]
      
            //   // const updateStock = await Product.update({availablestock:stockTerm},{where:{sku:bodycut[i].sku}})
            //   // const response =  axios.post('https://open-api.zortout.com/v4/Product/UpdateProductAvailableStockList?warehousecode=W0001', {stocks}, {headers: headers,});
            // }
             bodycut.splice(0, bodycut.length);
             cutter.splice(0, cutter.length);

        }
     
    }
  }
     const updateMovment = await orderMovement.update({statusStock:1},{where:{id:orderId.id}})
   
   }

   res.json('success')

} catch (error) {
    console.log(error)
    res.json(error)
}
})
module.exports = cusStock;
