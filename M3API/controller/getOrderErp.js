const express = require('express');
const getOrderErp = express.Router();
const { Op, sequelize } = require('sequelize');
const axios = require('axios')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { Sequelize, DataTypes, QueryTypes } = require('sequelize');
const { OrderHis } = require('../../zort/model/Order');
const { log } = require('console');
require('dotenv').config();
require('moment/locale/th');
const xlsx = require('xlsx')
// const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm');
const currentDate = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');

getOrderErp.post('/getOrderErp', async (req, res) => {

    const sequelize = new Sequelize(process.env.databaseerp, process.env.user, process.env.password, {
        dialect: process.env.dialact,
        host: process.env.server,
    });
    try {

        const data_orders = [];
        const query = `
                    SELECT OAOREF FROM [dbo].[data_order]`;

        const replacements = {}
        const result = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.INSERT
        });

        for (const data of result[0]) {
            const data_order = {
                number: data.OAOREF
            }
            data_orders.push(data_order)
        }
        // if (data_orders.length){
        //   res.json(data_orders);
        // } else {
        //   res.json({status : 'error', message: 'no data'});
        // }
        const uniqueData = new Set(data_orders.map(item => JSON.stringify(item)));
        const combinedData = Array.from(uniqueData).map(item => JSON.parse(item));

        res.json(combinedData);
    } catch (error) {
        console.log(error)
        res.json('Invalid data')
    }
}),
    getOrderErp.post('/getOrderErpToShow', async (req, res) => {
        const sequelize = new Sequelize(process.env.databaseerp, process.env.user, process.env.password, {
            dialect: process.env.dialact,
            host: process.env.server,
        });
        try {

            const data_orders = [];
            const query = `
                    SELECT OAOREF FROM [dbo].[data_order] WHERE STATUS = 0`;

            const replacements = {}
            const result = await sequelize.query(query, {
                replacements,
                type: sequelize.QueryTypes.INSERT
            });


            for (const data of result[0]) {
                const data_order = {
                    number: data.OAOREF
                }
                data_orders.push(data_order)
            }
            // if (data_orders.length){
            //   res.json(data_orders);
            // } else {
            //   res.json({status : 'error', message: 'no data'});
            // }
            const uniqueData = new Set(data_orders.map(item => JSON.stringify(item)));
            const combinedData = Array.from(uniqueData).map(item => JSON.parse(item));

            res.json(combinedData);
        } catch (error) {
            console.log(error)
            res.json('Invalid data')
        }
    }),


    getOrderErp.post('/getOrderExcel', async (req, res) => {
        try {
            const { fromDate, toDate } = req.body;
            // ตัวอย่างค่าที่ส่งมาใน body:
            // { "fromDate": "2025-11-01", "toDate": "2025-11-06" }

            // ✅ ตรวจสอบค่าที่ส่งมา
            if (!fromDate || !toDate) {
                return res.status(400).json({ message: 'กรุณาระบุ fromDate และ toDate' });
            }

            // ✅ แปลง string เป็น Date object
            const start = new Date(fromDate);
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999); // ครอบคลุมทั้งวัน

            // ✅ ดึงข้อมูลระหว่างวันที่
            const orderHis = await OrderHis.findAll({
                attributes: ['id', 'status', 'paymentstatus', 'createdAt'],
                where: {
                    status: { [Op.notIn]: ['Success', 'Voided'] },
                    createdAt: { [Op.between]: [start, end] }, // ✅ เลือกระหว่างวันที่
                },
                raw: true,
            });

            if (orderHis.length === 0) {
                return res.status(404).json({ message: 'ไม่พบข้อมูลในช่วงวันที่ที่ระบุ' });
            }

            // ✅ สร้าง Excel file จากข้อมูล
            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.json_to_sheet(orderHis);
            xlsx.utils.book_append_sheet(wb, ws, 'Orders');

            // ✅ ส่งกลับเป็น buffer โดยไม่ต้องเขียนไฟล์
            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Disposition', 'attachment; filename=OrderHis.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);

        } catch (error) {
            console.error('❌ Error generating Excel:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างไฟล์ Excel', error: error.message });
        }
    }),

    module.exports = getOrderErp
