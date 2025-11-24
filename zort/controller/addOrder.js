const express = require('express');
const moment = require('moment');
const { Op, where } = require('sequelize');
const axios = require('axios')
const addOrder = express.Router();
const jwt = require('jsonwebtoken');
// const fs = require('fs') ;
// const os = require('os');

const orderDataZort = require('../dataZort/allOrder');

const { Order, OrderDetail,OrderHis } = require('../model/Order') ;
const { Customer,ShippingAddress } = require('../model/Customer') ;
const { orderMovement } = require('../model/Ordermovement') ;
const { Product } = require('../model/Product')

const { sequelize } = require('../config/database');
require('moment/locale/th');
const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm');
let createdCount = 0;
let createdShipCount = 0;
let updatedCount = 0;
const response = {
    status: '-- complete',
    dateTime: currentDate,
  };

addOrder.put('/addOrder', async (req, res) => {
  const headers = {
    storename: process.env.zortstorename,
    apikey:  process.env.zortapikey,
    apisecret:  process.env.zortapisecret,
};
    try {
          const datapre = await orderDataZort() ;

        //   // const existingIds = (await OrderHis.findAll()).map(item => item.id);
        //   // const newDataList = datapre.list.filter(item => !existingIds.includes(item.id));
      
        //   // for (const existingId of existingIds) {
        //   //   const indexToRemove = newDataList.findIndex(item => item.id === existingId);
        //   //   if (indexToRemove !== -1) {
        //   //     newDataList.splice(indexToRemove, 1);
        //   //   }
        //   // }
          
        //   const updatedData = datapre.list.map(data => {
        //     if (data.saleschannel === "Lazada" && (!data.tag || data.tag === "")) {
        //         data.customercode = "OLAZ000000";
        //     }
        //     return data;
        // });
        
        // // console.log(updatedData);


        //   const existingIds = (await OrderHis.findAll()).map(item => item.id);
        //   const newDataList = updatedData.filter(item => !existingIds.includes(item.id));
        //   const filteredDataList = [];

        //   //ออเดอที่ cusCode ไม่มี shoppee
        //   const orderTaxShopee = [] ;

        //   for (const item of newDataList) {
        //     if (item.status !== "Voided" && item.customercode === "") {
        //         orderTaxShopee.push(item)
        //     }else{
        //         filteredDataList.push(item);
        //     }
        //   }

        //   const token = jwt.sign(
        //     { username: 'systemm3' },
        //     process.env.TOKEN_KEY,
        //     { expiresIn: '2h' }) 

        //   const response =  axios.put(process.env.API_URL+`/zort/customer/CustomerManage/updateCustomerInv?token=${token}`,{dataOrder:orderTaxShopee },{});
          
        //   const data2 = filteredDataList;
        //   // const data2 = response.data;
     
        // //  logger.info(JSON.stringify(data)) ;

        // //ปิดไว้เพื่อ test 
        // // await OrderDetail.destroy({truncate: true});



        // // const data2=newDataList ;
        // // const data2 = filteredDataList;

        // const datalength=data2.length ;
       
        // const { count } = await Order.findAndCountAll();
        // var constOld = count ;

        //   for(let i=0;i<datalength;i++){
            
        //     // var numberser = await axios.post(process.env.API_URL+'/M3API/OrderManage/Order/getNumberSeries',{ 
        //     //   series:'ง',
        //     //   seriestype:'01', 
        //     //   companycode:410,
        //     //   seriesname:'071' 
        //     //  },{});

        //     //  var seNo = (numberser.data[0].lastno+i); 
        //     //  var lastnumber = seNo ;
            
        //     const query = `
        //       IF EXISTS (SELECT id FROM [dbo].[order] WHERE id = `+data2[i].id+`) 
        //       BEGIN
        //         UPDATE [dbo].[order]
        //         SET [status] = :value6,
        //             paymentstatus = :value7
        //         WHERE [id] =`+data2[i].id+`;
        //       END  
        //       ELSE
        //       BEGIN
        //       INSERT INTO [dbo].[order] (id,[ordertype],[number],[customerid],[warehousecode],[status],[paymentstatus],[marketplacename],[marketplaceshippingstatus],[marketplacepayment],[amount],[vatamount] ,[shippingvat],[shippingchannel],
        //       [shippingamount],[shippingdate],[shippingdateString],[shippingname],[shippingaddress] ,[shippingphone] ,[shippingemail],[shippingpostcode],[shippingprovince],[shippingdistrict] ,[shippingsubdistrict],[shippingstreetAddress],
        //       [orderdate],[orderdateString],[paymentamount],[description],[discount],[platformdiscount],[sellerdiscount],[shippingdiscount],[discountamount],[voucheramount],[vattype],[saleschannel],[vatpercent],[isCOD],[createdatetime],
        //       [createdatetimeString],[updatedatetime],[updatedatetimeString],[expiredate],[expiredateString],[receivedate],[receivedateString],[totalproductamount],[uniquenumber],[properties],[isDeposit],[statusprint],[statusprintINV],[statusPrininvSuccess],[cono],[invno]) 
        //       VALUES (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,:value9,:value10,:value11,:value12,:value13,:value14,:value15,:value16,:value17,:value18,:value19,:value20,:value21,:value22,:value23,:value24,:value25,
        //       :value26,:value27,:value28,:value29,:value30,:value31,:value32,:value33,:value34,:value35,:value36,:value37,:value38,:value39,:value40,:value41,:value42,:value43,:value44,:value45,:value46,:value47,:value48,:value49,:value50,:value51,:value52,:value53,:value54,:value55,:value56,:value57)
      
        //       IF NOT EXISTS (SELECT 1 FROM [dbo].[orderMovement] WHERE id = :value1)
        //         BEGIN
        //             INSERT INTO [dbo].[orderMovement] (id, statusStock) VALUES (:value1, 0)
        //         END
        //       END`;

        //       const replacements = { 
        //         value1: data2[i].id,                        value11: data2[i].amount,             value21: data2[i].shippingemail,        value31: data2[i].discount,         value41: data2[i].createdatetime,       value51: data2[i].properties,
        //         value2: data2[i].ordertype,                 value12: data2[i].vatamount,          value22: data2[i].shippingpostcode,     value32: data2[i].platformdiscount, value42: data2[i].createdatetimeString, value52: data2[i].isDeposit,
        //         value3: data2[i].number,                    value13: data2[i].shippingvat,        value23: data2[i].shippingprovince,     value33: data2[i].sellerdiscount,   value43: data2[i].updatedatetime,       value53: '000',
        //         value4: data2[i].customerid,                value14: data2[i].shippingchannel,    value24: data2[i].shippingdistrict,     value34: data2[i].shippingdiscount, value44: data2[i].updatedatetimeString, value54:'',
        //         value5: data2[i].warehousecode,             value15: data2[i].shippingamount,     value25: data2[i].shippingsubdistrict,  value35: data2[i].discountamount,   value45: data2[i].expiredate,           value55:'000',
        //         value6: data2[i].status,                    value16: data2[i].shippingdate,       value26: data2[i].shippingstreetAddress,value36: data2[i].voucheramount,    value46: data2[i].expiredateString,     value56:1,
        //         value7: data2[i].paymentstatus,             value17: data2[i].shippingdateString, value27: data2[i].orderdate,            value37: data2[i].vattype,          value47: data2[i].receivedate,          value57:1,
        //         value8: data2[i].marketplacename,           value18: data2[i].shippingname,       value28: data2[i].orderdateString,      value38: data2[i].saleschannel,     value48: data2[i].receivedateString, 
        //         value9: data2[i].marketplaceshippingstatus, value19: data2[i].shippingaddress,    value29: data2[i].paymentamount,        value39: data2[i].vatpercent,       value49: data2[i].totalproductamount, 
        //         value10: data2[i].marketplacepayment,       value20: data2[i].shippingphone,      value30: data2[i].description,          value40: data2[i].isCOD,            value50: data2[i].uniquenumber, 
        //       }
        //       const result = await sequelize.query(query, {
        //         replacements,
        //         type: sequelize.QueryTypes.INSERT
        //       }); 
  
        //       if(data2[i].tag == null){
        //         if(data2[i].saleschannel == 'Lazada'){
        //           const query3 = `UPDATE [dbo].[customer] SET [customercode]  = 'OLAZ000000' WHERE customerid = `+data2[i].customerid+``  ;
        //           const result3 = await sequelize.query(query3, {
        //             type: sequelize.QueryTypes.INSERT
        //           });

        //         }
                
        //       }else{
        //         const query2 = `UPDATE [dbo].[order] SET [statusprintINV]  = 'TaxInvoice' WHERE id = `+data2[i].id+``  ;
        //         const result2 = await sequelize.query(query2, {
        //           type: sequelize.QueryTypes.INSERT
        //         });
        //       }
        //       // console.log(result)
        //   }


        //   const orderDatup = await Order.findAll({where:{cono:1}})
        //   if(orderDatup == null){

        //   }else{

        //     for(let i=0;i<orderDatup.length;i++){

        //       var numberser = await axios.post('http://192.168.2.97:8383/M3API/OrderManage/Order/getNumberSeries',{ 
        //       // var numberser = await axios.post(process.env.API_URL+'/M3API/OrderManage/Order/getNumberSeries',{ 
        //        series:'ง',
        //        seriestype:'01', 
        //        companycode:410,
        //        seriesname:'071' 
        //       },{});
              
        //        var invser = await axios.post(process.env.API_URL+'/M3API/OrderManage/Order/getInvNumber',{ 
        //         ordertype:'071'
        //       },{});
 
        //       var invm3 = parseInt(invser.data[0].customerordno)
        //       const inv12T = await Order.findAll({attributes:['invno'],limit:1,order: [['invno', 'DESC']],})
        //       console.log(inv12T[0].invno);
        //       var inv12tcon = parseInt(inv12T[0].invno)
        //       if(invm3 > inv12tcon){

        //         var inNo = (parseInt(invser.data[0].customerordno) );
        //         var invnumber = inNo+1 ;
        //       }else{
        //         var inNo = (inv12tcon + 1);
        //         var invnumber = inNo ;
        //       }
        //       if(i == 0){
        //         var seNo = (numberser.data[0].lastno+1);  
        //       }else{
        //         var seNo = (numberser.data[0].lastno+i);  
        //       }
            
        //       var lastnumber = seNo ;


        //     //  const updateInv = await Order.update({invno:invnumber},{where:{id:orderDatup[i].id,statusprintINV:{[Op.eq]:'TaxInvoice'}}})

        //      const updateRun = await Order.update({cono:lastnumber,invno:invnumber},{where:{id:orderDatup[i].id}})
        //    }
           
        //   }
         
        //   var countnew = await Order.count();
        //   if(countnew > constOld){
        //     var updateNumber = await axios.post(process.env.API_URL+'/M3API/OrderManage/Order/updateNumberRunning',{ 
        //       series:'ง',
        //       seriestype:'01', 
        //       companycode:410,
        //       seriesname:'071',
        //       lastno:numberser.data[0].lastno+(countnew-constOld)
        //      }, {});
        //   }

        //   for (const item of data2) {
        //       createddate = currentDate;
        //       const { customerid, customername, customercode ,customeridnumber,customeremail,customerphone,customeraddress,customerpostcode,customerprovince,customerdistrict,customersubdistrict,customerstreetAddress,customerbranchname,customerbranchno,facebookname,facebookid,line,lineid} = item;
        //       await  Customer.findOrCreate({where:{customerid:item.customerid},defaults:{...item,createddate:currentDate}}).then(async ([customer, created]) => {
        //       if (created) {
        //         createdCount++;
        //       } else {
        //       await Customer.update({customeraddress:item.customeraddress},{
        //           where: { 
        //             customerid:item.customerid,
        //             customeraddress:{
        //               [Op.ne]: item.customeraddress
        //             }
        //           }
        //         }).then(([updatedRows]) => {
        //           if (updatedRows) {
        //             updatedCount++;
        //           } else {}
        //         }) 
        //       } 
        //     });
  
        //     item.shi_customerid = item.customerid ;
        //     item.order_id = item.id
        //     const { shi_customerid,shippingname,shippingaddress,shippingphone,shippingemail,shippingpostcode,shippingprovince,shippingdistrict,shippingsubdistrict,shippingstreetAddress } = item ;
        //     await ShippingAddress.create(item); 
        //     await ShippingAddress.findOrCreate({ where: { shippingaddress: shippingaddress }, defaults: { ...item} }).then(([shippingaddress,created]) => {
        //       if (created) {
        //         createdShipCount++;
        //       } else {}
        //     }); 
        //   }

        //   for(let i=0;i<datalength;i++){
        //     if(data2[i].sellerdiscount > 0){

        //       var itemDisOnline = await axios.post(process.env.API_URL+'/M3API/ItemManage/Item/getItemDisOnline',{ 
        //         itemtype:'ZNS',
        //         itemcode:'DISONLINE', 
        //       companycode:410,
            
        //      },{});

        //     //  var seNo = (numberser.data[0].lastno+i); 

        //       await OrderDetail.create({
        //         id:data2[i].id,
        //         productid:8888888, //disonline
        //         name:itemDisOnline.data[0].itemname,
        //         sku:itemDisOnline.data[0].itemcode+'_PCS',
        //         number:1,
        //         unittext:'PCS',
        //         pricepernumber:data2[i].sellerdiscount,
        //         totalprice:data2[i].sellerdiscount
        //       })

        //     }
            
           
        //       if(data2[i].saleschannel == 'Lazada'){
        //         if((data2[i].shippingamount - data2[i].discountamount) == 0){

        //         }else{
        //           await OrderDetail.create({id:data2[i].id,productid:9999999,name:'ค่าขนส่ง',sku:'ZNS1401001_JOB',number:1,totalprice:data2[i].shippingamount,pricepernumber:data2[i].shippingamount,unittext:'JOB'})
        //         }
        //       }else if(data2[i].saleschannel == 'Shopee'){
        //         if(data2[i].shippingamount == 0){

        //         }else{
        //           await OrderDetail.create({id:data2[i].id,productid:9999999,name:'ค่าขนส่ง',sku:'ZNS1401001_JOB',number:1,totalprice:data2[i].shippingamount,pricepernumber:data2[i].shippingamount,unittext:'JOB'})
        //         }
        //       }
            
           
           
        //     for(const list of data2[i].list){
        //       // console.log(data2[i].id) 
        //       const { auto_id, ...orderDatadetail } = list ; 
        //       orderDatadetail.id = data2[i].id ;
          
        //       await OrderDetail.bulkCreate([orderDatadetail])

        //       await OrderDetail.update({procode:'FV2F',pricepernumber:0,discount:0,discountamount:0},
        //       {where:{
        //         totalprice:0,
        //         sku:{
        //           [Op.ne]:'ZNS1401001'
        //         },
        //         productid:{
        //           [Op.ne]:'8888888'
        //         }
        //       }}) 
        //     }
        // }
  
        
        // const orderMoment = await orderMovement.findAll({where:{statusStock:'0'}})
        // for(const list of orderMoment ){
        //   const detail = await OrderDetail.findAll({attributes:['sku','number'],where:{id:list.id}})
        //   for(const listofdetail of detail){
        //     // console.log(listofdetail.sku)
        //     const ctstock5 = await Product.findAll({
        //       attributes:['sku','stock'],
        //       where:{
        //         sku:listofdetail.sku
        //       }
        //     })
        //     for(const ctstock of ctstock5){
        //       const itcode = ctstock.sku
        //     var itcodeOnly = itcode.split('_')[0];
          
        //     const response = await axios.post(process.env.API_URL+'/M3API/ItemManage/Item/getItemConvert',{ itemcode:itcodeOnly }, {
        //             headers: {
        //             },
        //           });
        //             const restdata = response.data ;
        //             // console.log(restdata[0].type)
  
        //             // for(const listProSku of ctstock){
        //             //   console.log(listProSku.sku)
        //             // }
        //             const ctstock2 = await Product.findAll({
        //               attributes:['sku','stock'],
        //               where:{
        //                 sku:{
        //                   [Op.like]: `%${itcodeOnly}%`
        //               }}
        //             })
  
        //           for(const fstock of ctstock2){
        //             // console.log(fstock.sku)
        //             var fstockSku = fstock.sku 
        //             var itsku = fstockSku.split('_')[1] ;
        //           //  console.log(itsku)
        //            const restIns = restdata[0].type
        //             for(const restSku of restIns){
                     
        //                 if(itsku == restSku.unit){
                         
        //                   var itskulist = listofdetail.sku.split('_')[1] ; //pcs is not
        //                   if(itskulist == restSku.unit){
        //                     var cut_stock = (listofdetail.number * restSku.factor)
        //                   }
        //                   console.log(listofdetail.sku + " order stock :" + cut_stock)
        //                   const pcsUnit = (restSku.factor * fstock.stock)
        //                   console.log(fstock.sku + " stock now :" + pcsUnit)
        //                   console.log(fstock.sku + " cut stock :" + (pcsUnit - cut_stock))
        //                   console.log(fstock.sku + " stock pre update :" + (fstock.stock))
        //                   console.log(fstock.sku + " stock update: " + Math.max(0, Math.floor((pcsUnit - cut_stock) / restSku.factor)));
        //                   const qtysTOCK =  isNaN((pcsUnit - cut_stock) / restSku.factor) ? 0 : Math.max(0, Math.floor((pcsUnit - cut_stock) / restSku.factor));
        //                   console.log(qtysTOCK)
        //                   console.log("------------------------------------------")
                         
        //                   const updateStock = await Product.update({stock:qtysTOCK},{where:{sku:fstock.sku}})
        //                    const updateMovment = await orderMovement.update({statusStock:1},{where:{id:list.id}})

  
        //                   // console.log(restSku.factor)
        //                   // console.log(fstock.stock)
        //                   var stocks = [
        //                     {
        //                       "sku": fstock.sku,
        //                       "stock": qtysTOCK,
        //                     //   "cost": 999
        //                     }
        //                   ]

        //                   const response =  axios.post('https://open-api.zortout.com/v4/Product/UpdateProductAvailableStockList?warehousecode=W0001', {stocks}, {
        //                     headers: headers,
        //                   });

        //                   const responseStock =  axios.post('https://open-api.zortout.com/v4/Product/UpdateProductStockList?warehousecode=W0001', {stocks}, {
        //                     headers: headers,
        //                   });
                         
        //                 }else if((itsku == 'PCS')||(itsku == 'BOT')||(itsku == 'Free')){
        //                     console.log('PCS')
        //                     if((itskulist != 'PCS')||(itskulist != 'BOT')||(itskulist != 'Free')){
        //                       var cut_stock = (listofdetail.number * restSku.factor)
        //                     }else{
        //                       var cut_stock = listofdetail.number
        //                     }
        //                     console.log(listofdetail.sku + " order stock :" + cut_stock)
        //                     const pcsUnit = (fstock.stock)
        //                     console.log(fstock.sku + " stock now :" + pcsUnit)
        //                     // console.log(fstock.sku + " cut stock :" + (pcsUnit - cut_stock))
        //                     console.log(fstock.sku + " stock pre update :" + (fstock.stock))
        //                     console.log(fstock.sku + " stock update: " + Math.max(0, Math.floor(pcsUnit - cut_stock)));
        //                     const qtysTOCK =  Math.max(0, Math.floor(pcsUnit - cut_stock));
        //                     console.log(qtysTOCK)
        //                     console.log("------------------------------------------")
        //                    const updateStock = await Product.update({stock:qtysTOCK},{where:{sku:fstock.sku}})
        //                    const updateMovment = await orderMovement.update({statusStock:1},{where:{id:list.id}})

        //                    var stocks = [
        //                     {
        //                       "sku": fstock.sku,
        //                       "stock": qtysTOCK,
        //                     //   "cost": 999
        //                     }
        //                   ]

        //                   const response =  axios.post('https://open-api.zortout.com/v4/Product/UpdateProductAvailableStockList?warehousecode=W0001', {stocks}, {
        //                     headers: headers,
        //                   });

        //                   const responseStock =  axios.post('https://open-api.zortout.com/v4/Product/UpdateProductStockList?warehousecode=W0001', {stocks}, {
        //                     headers: headers,
        //                   });

        //                 }
        //             }
                   
        //           }
          
           
        //     // const updateStock = await Product.update({stock:stockIns},{where:{sku:listofdetail.sku}})
        //     // const updateMovment = await orderMovement.update({statusStock:1},{where:{id:list.id}})
        //     }
            
        //   }
        // }

        // res.status(200).json({response,'Inser_cus: ':createdCount,'Update_cus: ':updatedCount,'lastnumber:':lastnumber,'order count(std)':constOld,'order count(new)':countnew});
        // updatedCount=0 ;
        // createdCount=0;
        // createdShipCount=0;
        res.json(datapre)
      } catch (error) {
        console.log(error)
        res.status(500).json(error) 
      } 

  });

module.exports = addOrder;    