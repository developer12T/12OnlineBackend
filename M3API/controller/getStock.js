const express = require('express');
const getStock = express.Router();
const { Stock, StockAll } = require('../model/stock');
const { Item } = require('../model/Item');
const {Sequelize, AsyncQueueError, Op} = require('sequelize');
const { log } = require('console');

getStock.post('/getStockAll', async (req, res) => {
  try {
    const warehouse = req.body.warehouse;
    const stocks = [];
    const data = await StockAll.findAll({
      attributes: { 
        exclude: ['id'],
      },
      where: {
        companycode: 410,
        warehouse: warehouse,
        itemcode: {
          [Op.notIn]: ['100', '600']
        },
        balance: {
          [Op.gt]: 0
        }
      }
    });

    for (let i = 0; i < data.length; i++) {
      const itemsName = await Item.findAll({
        attributes:['itemname'],
        where:{itemcode:data[i].itemcode},
        group: ['MMITDS']
      })

      itemsName.forEach((item) => {
        console.log(item.itemname)
         iname = item.itemname
      })

      const stock = {
        companycode: data[i].companycode,
        warehouse: data[i].warehouse,
        itemcode: data[i].itemcode.trim(),
        itemsname: iname,
        balance: data[i].balance,
        allocated: data[i].allocated,
        available: data[i].balance - data[i].allocated
      };
      
      stocks.push(stock)
    }

    res.json(stocks)

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message })
  }
})

getStock.post('/getStock', async (req, res) => {
  try {
    const warehouse = req.body.warehouse
    const stocks = []
    const data = await Stock.findAll({
      attributes: { 
        exclude: ['id'],
        // include: [ 
        //   [Sequelize.literal('MLSTQT - MLALQT'), 'available'],
        // ],
      },
      where:{companycode:410,warehouse:warehouse}
    });
    for(let i =0 ;i <data.length;i++){

      const itemsName = await Item.findAll({
        attributes:['itemname'],
        where:{itemcode:data[i].itemcode},
        group: ['MMITDS']
      })

      itemsName.forEach((item) => {
        console.log(item.itemname);
         iname = item.itemname;
      });
   

      const stock = {
        companycode:data[i].companycode,
        warehouse:data[i].warehouse,
        itemcode:data[i].itemcode.trim(),
        itemsname:iname,
        location:data[i].location.trim(),
        lot:data[i].lot,
        balance:data[i].balance,
        allocated:data[i].allocated,
        available:data[i].balance-data[i].allocated
      }
     stocks.push(stock);

    }
    res.json(stocks);

  } catch (error) {
    console.error(error);
    res.json(error);
  }
}),

getStock.post('/getStockDetail', async (req, res) => {
  const warehouse = req.body.warehouse
  const itemcode = req.body.itcode
  try {
    const stocks = []

    if(itemcode == ''){
      var data = await Stock.findAll({
        attributes: { 
          exclude: ['id'],
          // include: [ 
          //   [Sequelize.literal('MLSTQT - MLALQT'), 'available'],
          // ],
         
        },
        where:{warehouse:warehouse}
      });
    }else{
      var data = await Stock.findAll({
        attributes: { 
          exclude: ['id'],
          // include: [ 
          //   [Sequelize.literal('MLSTQT - MLALQT'), 'available'],
          // ],
         
        },
        where:{itemcode:itemcode,warehouse:warehouse},
        
      });
    }

   
    for(let i =0 ;i <data.length;i++){

      const itemsName = await Item.findAll({
        attributes:['itemname'],
        where:{itemcode:data[i].itemcode},
        group: ['MMITDS']
      })

      itemsName.forEach((item) => {
        console.log(item.itemname);
         iname = item.itemname;
      });
   

      // const iname = itemsName.itemname;
      // const iname = itemsName[0].itemname;

      const stock = {
        companycode:data[i].companycode,
        warehouse:data[i].warehouse,
        itemcode:data[i].itemcode,
        itemsname:iname,
        location:data[i].location,
        lot:data[i].lot,
        balance:data[i].balance,
        allocated:data[i].allocated,
        available:data[i].balance-data[i].allocated
      }
     stocks.push(stock);

    }
    res.json(stocks); 

  } catch (error) {
    console.error(error);
    res.json(error);
  }
}),

getStock.post('/getStockCount', async (req, res) => {
  try {
    const data = await Stock.count({where:{companycode:410,warehouse:"108"}})
    res.json([{"stockerp":data}]);

  } catch (error) {
    console.error(error);
    res.json(error);
  }
}),
  (module.exports = getStock);
