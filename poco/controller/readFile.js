const express = require('express');
const readFile = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const moment = require('moment');

const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH-mm-ss');
readFile.post('/readFile', async (req, res) => {
    const filename =  req.body.fileName
    try {
        const filePath = `poco/storage/${filename}`;

        const workbook = xlsx.readFile(filePath);
        // console.log(workbook);
        const sheetName = workbook.SheetNames[0];
        // console.log(sheetName);
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        const jsonDataFromRow3 = jsonData.slice(2); 

        const jsonDataWithEmptyValues = jsonDataFromRow3.map(row => {
            return {
                "__EMPTY": row["__EMPTY"] || null,
                "ราคาและรายการซื้อสิ้นค้าบริษัท เอฟ-พลัส จำกัด ": row["ราคาและรายการซื้อสิ้นค้าบริษัท เอฟ-พลัส จำกัด "] || null,
                "__EMPTY_1": row["__EMPTY_1"] || null,
                "__EMPTY_2": row["__EMPTY_2"] || null,
            };
        });

        const jsonDataWithRenamedProperties = jsonDataWithEmptyValues.map(row => {
            return {
                channel: row["__EMPTY"],
                productId: row["ราคาและรายการซื้อสิ้นค้าบริษัท เอฟ-พลัส จำกัด "],
                productName: row["__EMPTY_1"],
                pricePerCTN: row["__EMPTY_2"],
            };
        });

        res.status(200).json({count:jsonDataWithRenamedProperties.length,list:jsonDataWithRenamedProperties});
    } catch (error) {
        console.log(error);
        res.status(400).json(error)
    }
})

module.exports = readFile;  