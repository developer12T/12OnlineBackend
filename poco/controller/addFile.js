const express = require('express');
const addFile = express.Router();
const multer = require('multer');
const moment = require('moment');
const axios = require('axios')
const jwt = require('jsonwebtoken');
const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH-mm-ss');
const currentDateIn = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm:ss');
const { preItemMaster } = require('../model/Preitemmaster')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'poco/storage'); // กำหนดที่เก็บไฟล์
    },
    filename: function (req, file, cb) {
        cb(null, currentDate + '_ItemMaster_'+file.originalname); // กำหนดชื่อไฟล์
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            cb(null, true); // ยอมรับเฉพาะไฟล์ Excel
        } else {
            cb('Only Excel files are allowed.',false);
        }
    }
});



addFile.post('/addFile',upload.single('ItemMaster'), async (req, res) => {
    try {
        if (req.file) {
            await preItemMaster.destroy({truncate:true})
            const token = jwt.sign({ username: 'systemm3' },process.env.TOKEN_KEY,{ expiresIn: '2h' }) 
            const response = await axios.post(process.env.API_URL+`/PurchaseCustomerOrder/file/FileManage/readFile`,{fileName:req.file.filename,token:token},{});
            const Item = response.data.list

           

            const responseM312T = await axios.post('http://192.168.2.97:8383/M3API/ItemManage/Item/getItem',{},{});
            const responseM3Fp = await axios.post('http://127.0.0.1:8383/M3API/ItemManage/Item/getItemFplus',{},{});
            
            // const ItemM312T = responseM312T.data

            const filteredItems = responseM312T.data.filter(item => item.companycode === 410).map(item => {
                                          const modifiedItem = {...item};
                                          modifiedItem.itemcode = item.itemcode.trim();
                                          return modifiedItem;
                });

             const filteredItemsFp = responseM3Fp.data.filter(item => item.companycode === 380).map(item => {
                                          const modifiedItem = {...item};
                                          modifiedItem.itemcode = item.itemcode.trim();
                                          return modifiedItem;
                });    
                const itemApi = []
                const itemApiFp = []
            // console.log(filteredItems);
                for(const product of Item){
                    var proId = product.productId
                    const filteredItems2 = filteredItems.filter(item => item.itemcode === `${proId}`)
                    // console.log(filteredItems2[0]);
                    itemApi.push(filteredItems2[0])
                }

                for(const product of Item){
                    var proId = product.productId
                    const filteredItems2Fp = filteredItemsFp.filter(item => item.itemcode === `${proId}`)
                    // console.log(filteredItems2[0]);
                    itemApiFp.push(filteredItems2Fp[0])
                }

           
            for(const list of Item){

                if((list.channel === null) || (list.productId === null) || (list.productName === null) || (list.pricePerCTN === null)){
                    var status = 0 
                }else{
                    var status = 1 
                }

                const statusAc = itemApi
                .filter(item => item.itemcode === `${proId}`)
                .map(item => item.status);


                console.log(itemApiFp);

                const statusAcFp = itemApiFp
                .filter(item => item.itemcode === `${proId}`)
                .map(item => item.status);

                // console.log(statusAcFp[0]);

                if(statusAc[0] === '20'){
                    var status12T = 'open'
                }else if(statusAc[0] === '10'){
                    var status12T = 'close'
                }
 
                if(statusAcFp[0] === '20'){
                    var statusFplus = 'open'
                }else if(statusAcFp[0] === '10'){
                    var statusFplus = 'close'
                }
                console.log(itemApi.itemgroup);

                await preItemMaster.create({
                    channel:list.channel,
                    group:0,
                    productId:list.productId,
                    productName:list.productName,
                    pricePerCTN:list.pricePerCTN,
                    status:status,
                    statusActive12T:status12T,
                    statusActiveFplus:statusFplus,
                    createdAt:currentDateIn,
                    updatedAt:currentDateIn}) ;
            }

            const data = response.data.list;

            data.sort((a, b) => {
                const aHasNull = Object.values(a).some(value => value === null);
                const bHasNull = Object.values(b).some(value => value === null);
              
                if (aHasNull && !bHasNull) {
                  return -1;
                } else if (!aHasNull && bHasNull) {
                  return 1;
                }
                return (a.channel || '').localeCompare(b.channel || '');
              });

            for (let i = 0; i < Item.length; i++) {

                await preItemMaster.update({group:itemApi[i].itemgroup},{where:{productId:  Item[i].productId}})
            }

            const itemData = await preItemMaster.findAll()

 
            for (let i = 0; i < Item.length; i++) {

                Item[i].group = itemApi[i].itemgroup 
            }

            itemData.sort((a, b) => {
                if (!a.statusActive12T || !b.statusActive12T) {
                  if (!a.statusActive12T && !b.statusActive12T) {
                    if (!a.statusActiveFplus || !b.statusActiveFplus) {
                      if (!a.statusActiveFplus && !b.statusActiveFplus) {
                        return a.pricePerCTN - b.pricePerCTN;
                      }
                      return a.statusActiveFplus ? -1 : 1;
                    }
                    return !a.statusActiveFplus ? -1 : 1;
                  }
                  return !a.statusActive12T ? -1 : 1;
                }
                if (a.statusActive12T !== b.statusActive12T) {
                  return a.statusActive12T ? -1 : 1;
                }
                if (a.statusActiveFplus !== b.statusActiveFplus) {
                  return a.statusActiveFplus ? -1 : 1;
                }
                return a.pricePerCTN - b.pricePerCTN;
              });
             
            res.status(200).json({count:data.length,list:itemData}); 

        } else {
            res.status(400).json({ message: 'No file uploaded.' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'An error occurred.', error: error.error,status:500 });
    }
})

module.exports = addFile;   