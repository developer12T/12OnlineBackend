const express = require('express');
const moment = require('moment');
const { Op } = require('sequelize');
const axios = require('axios'); 
const fs = require('fs') ;

const os = require('os');

require('moment/locale/th');

const addProduct = express.Router();

const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm:ss');

const productDataZort = require('../dataZort/allProduct');

const { Product } = require('../model/Product') ;


let createdproduct = 0;
let Updateproduct = 0;

const response = {
    status: '-- complete',
    dateTime: currentDate,
  };

addProduct.put('/addProduct', async (req, res) => {

    try {
        // const { count } = await Product.findAndCountAll({});
        //   console.log(count);
        
        // const data = await productDataZort();
        // const data2=data.list ;
        // for (const item of data2) {
        //     const { imagepath,imageList, ...productData } = item ; 
        //    createdproduct++;

        //  await Product.findOrCreate({where:{id:productData.id},defaults:{...productData}}).then(([product,created]) => {
        //     if(created){
        //         createdproduct++;
        //     }else{
        //         Product.update({...productData},{
        //             where: { 
        //                 id:productData.id,
        //                 [Op.or]: [
        //                     { producttype: { [Op.ne]: productData.producttype } },
        //                     { name: { [Op.ne]: productData.name } },
        //                     { sku: { [Op.ne]: productData.sku } },
        //                     { sellprice: { [Op.ne]: productData.sellprice } }, 
        //                     { purchaseprice: { [Op.ne]: productData.purchaseprice } },
        //                     { stock: { [Op.ne]: productData.stock } },
        //                     { availablestock: { [Op.ne]: productData.availablestock } },
        //                     { unittext: { [Op.ne]: productData.unittext } }, 
        //                     { weight: { [Op.ne]: productData.weight } },
        //                     { height: { [Op.ne]: productData.height } },
        //                     { width: { [Op.ne]: productData.width } },
        //                     { categoryid: { [Op.ne]: productData.categoryid } },
        //                     { category: { [Op.ne]: productData.category } },
        //                     { variationid: { [Op.ne]: productData.variationid } },
        //                     { variant: { [Op.ne]: productData.variant } },
        //                     { tag: { [Op.ne]: productData.tag } },
        //                     { sharelink: { [Op.ne]: productData.sharelink } },
        //                     { active: { [Op.ne]: productData.active } },
        //                     { properties: { [Op.ne]: productData.properties } }
        //                 ]
        //               }
        //         }).then(([updatedRows]) => {
        //             if (updatedRows) {
        //                 Updateproduct++;
        //             } else {}
        //         })
        //     }
        // }) ;
        //  }

        //  const filePath = `zort/temp_data/product/product.json`;
        //  console.log(filePath)
        //  fs.mkdirSync('zort/temp_data/product', { recursive: true });
        //  data.res = currentDate ;
        //  fs.writeFileSync(filePath, JSON.stringify(data)+ os.EOL, { flag: 'a' });
        await Product.destroy({truncate: true});
        const data = await productDataZort();
        const data2=data.list ;
        for (const item of data2) {
            const { imagepath,imageList, ...productData } = item ; 
        
         await Product.create({...productData})
        }

        res.status(200).json('success');
        createdproduct = 0;
    } catch (error) {
        console.log(error)
        res.status(500).json(error);
    }

  });  

module.exports = addProduct;    