const express = require('express');
const updateStock12T = express.Router();
const { Op } = require('sequelize');
const { Product } = require('../model/Product') ;
const axios = require('axios'); 
const stock = require('../dataM3/getStock')

updateStock12T.put('/updateStock12T', async (req, res) => { 
    try {  
                const data = await stock() ;
                const itemcodeToAvailableBalanceSum = {};
                const headers = {
                    storename: process.env.zortstorename,
                    apikey:  process.env.zortapikey,
                    apisecret:  process.env.zortapisecret,
                };

            data.forEach(item => {
                const { itemcode, available, balance } = item;
                const trimmedItemcode = itemcode.trim(); 
                if (trimmedItemcode in itemcodeToAvailableBalanceSum) {
                  itemcodeToAvailableBalanceSum[trimmedItemcode].available += available;
                  itemcodeToAvailableBalanceSum[trimmedItemcode].balance += balance;
                } else {
                  itemcodeToAvailableBalanceSum[trimmedItemcode] = {
                    available,
                    balance
                  };
                }
              });
              
              const result = Object.keys(itemcodeToAvailableBalanceSum).map(itemcode => ({
                itemcode,
                sumavailable: itemcodeToAvailableBalanceSum[itemcode].available,
                sumbalance: itemcodeToAvailableBalanceSum[itemcode].balance
              }));

            //  console.log(result.length);
              for(let i=0;i<result.length;i++){

                //  console.log(result[i].itemcode)

                const stockzort = await Product.findAll({
                    attributes:['sku','stock'],
                    where:{
                        sku:{
                            [Op.like]: `%${result[i].itemcode}%`
                        }
                    }
                })
                    for(const skuZort of stockzort){

                        const itcode = skuZort.sku
                        var itcodeOnly = itcode.split('_')[0];
                        var unitOnly = itcode.split('_')[1];

                        try {
                            const response = await axios.post(process.env.API_URL+'/M3API/ItemManage/Item/getItemConvertItemcode',{ itcode:itcodeOnly }, {});

                            const restdata = response.data;
                                // console.log(restdata[0].type.factor);
                                const restIns = restdata[0].type
                                for(const restSku of restIns){
                                  
                                    if((unitOnly == 'PCS' )||(unitOnly == 'BOT') || (unitOnly == 'Free')  ){
                                        console.log('testttt'+itcodeOnly+'_'+unitOnly);
                                        var skufind = itcodeOnly+'_'+unitOnly
                                        await Product.update({stock:result[i].sumbalance,availablestock:result[i].sumavailable},{where:{sku:skufind}})

                                       var stocks = [
                                            {
                                              "sku": skufind,
                                              "stock": result[i].sumavailable,
                                            //   "cost": 999
                                            }
                                          ]

                                          // pid tam kumsung date 2023/10/09 10:25
                                          // const response =  axios.post('https://open-api.zortout.com/v4/Product/UpdateProductAvailableStockList?warehousecode=W0001', {stocks}, {
                                          //   headers: headers,
                                          // });
                                          //end


                                          // const responseStock = await axios.post('https://open-api.zortout.com/v4/Product/UpdateProductStockList?warehousecode=W0001', {stocks}, {
                                          //   headers: headers,
                                          // });
                                          

                                    }else if(unitOnly == restSku.unit){
                                        var skufind = itcodeOnly+'_'+unitOnly
                                        var stockCon = Math.floor(result[i].sumbalance / restSku.factor);
                                        var avistockCon = Math.floor(result[i].sumavailable / restSku.factor);
                                        await Product.update({stock:stockCon,availablestock:avistockCon},{where:{sku:skufind}})
                                        var stocks = [
                                            {
                                              "sku": skufind,
                                              "stock": avistockCon,
                                            //   "cost": 999
                                            }
                                          ]

                                           // pid tam kumsung date 2023/10/09 10:25
                                          // const response =  axios.post('https://open-api.zortout.com/v4/Product/UpdateProductAvailableStockList?warehousecode=W0001', {stocks}, {
                                          //   headers: headers,
                                          // });
                                          //end

                                          // const responseStock = await axios.post('https://open-api.zortout.com/v4/Product/UpdateProductStockList?warehousecode=W0001', {stocks}, {
                                          //   headers: headers,
                                          // });

                                    }
                                }
                        } catch (error) {
                            console.error('Error during Axios POST:', error.message);
                        }
                    }
              }
    
        res.json(result)
    } catch (error) {
        res.status(500).json('Invalid data')
    }
})

module.exports = updateStock12T;    