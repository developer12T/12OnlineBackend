const express = require('express');

const { Op } = require('sequelize');

const updateStatusOrder = express.Router();

const orderDataZort = require('../../dataZort/orderUpdate');
const { Order,OrderHis } = require('../../model/Order') ;
require('moment/locale/th');

  updateStatusOrder.put('/updateStatusOrder', async (req, res) => {
 
    try {
          const dataOrder = await orderDataZort() ;
          const filteredList = dataOrder.list.filter(item => item.status !== 'Success').map(item => {
            return {
              "id": item.id,
              "status": item.status,
              "paymentstatus": item.paymentstatus
            };
          });
     
          // const order = await Order.findAll({attributes:['id','status','paymentstatus']})
          const order = await Order.findAll({attributes:['id','status','paymentstatus'],where:{status:{[Op.not]:['Success','Voided']}}})
          const orderHis = await OrderHis.findAll({attributes:['id','status','paymentstatus'],where:{status:{[Op.not]:['Success','Voided']}}})

          // const uniqueOrders = order.filter(orderItem => {
          //   // ใช้ฟังก์ชัน every() เพื่อตรวจสอบว่ามี order ใน filteredList ที่ตรงกับ orderItem ทั้ง 3 ฟิลด์หรือไม่
          //   return !filteredList.every(filterItem =>
          //     filterItem.id === orderItem.id &&
          //     filterItem.status === orderItem.status &&
          //     filterItem.paymentstatus === orderItem.paymentstatus
          //   );
          // });

          const nonMatchingOrders = order.filter(orderItem => {
            // ใช้ฟังก์ชัน some() เพื่อตรวจสอบว่ามี order ใน filteredList ที่ตรงกับ orderItem ทั้ง 3 ฟิลด์หรือไม่
            return !filteredList.some(filterItem =>
              filterItem.id === orderItem.id &&
              filterItem.status === orderItem.status &&
              filterItem.paymentstatus === orderItem.paymentstatus
            );
          }); 
          
          const nonMatchingOrdersHis = orderHis.filter(orderItem => {
            // ใช้ฟังก์ชัน some() เพื่อตรวจสอบว่ามี order ใน filteredList ที่ตรงกับ orderItem ทั้ง 3 ฟิลด์หรือไม่
            return !filteredList.some(filterItem =>
              filterItem.id === orderItem.id &&
              filterItem.status === orderItem.status &&
              filterItem.paymentstatus === orderItem.paymentstatus
            );
          });
          
          for (let i = 0; i < nonMatchingOrders.length; i++) {
            const matchingDataOrderItem = dataOrder.list.find(item => item.id === nonMatchingOrders[i].id);
          
            if (matchingDataOrderItem) {
              await Order.update(
                {
                  status: matchingDataOrderItem.status,
                  paymentstatus: matchingDataOrderItem.paymentstatus
                },
                {
                  where: { id: nonMatchingOrders[i].id }
                }
              );
            }
          }

          for (let i = 0; i < nonMatchingOrdersHis.length; i++) {
            const matchingDataOrderItem = dataOrder.list.find(item => item.id === nonMatchingOrdersHis[i].id);
          
            if (matchingDataOrderItem) {
              await OrderHis.update(
                {
                  status: matchingDataOrderItem.status,
                  paymentstatus: matchingDataOrderItem.paymentstatus
                },
                {
                  where: { id: nonMatchingOrdersHis[i].id }
                }
              );
            }
          }
    
          
        res.json(nonMatchingOrdersHis)
      } catch (error) {
        console.log(error)
        res.status(500).json(error) 
      } 

  });  

module.exports = updateStatusOrder;    