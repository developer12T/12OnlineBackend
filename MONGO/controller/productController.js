const orderModel = require('../../MONGO/models/orderMongo')
const orderOldModel = require('../../MONGO/models/orderMongoOld')
const productModel = require('../../MONGO/models/productMongo')
const { OrderHis, OrderDetailHis, Order, OrderDetail } = require('../../zort/model/Order')
const { Customer } = require('../../zort/model/Customer')
const { Product } = require('../../zort/model/Product')
const { Op } = require('sequelize');
const { getModelsByChannel } = require('../../authen/middleware/channel')


exports.addProductToMongo = async (req, res) => {
    try {
        const { type } = req.body
        const channel = req.headers['x-channel']
        // const { Ordermongo } = getModelsByChannel(channel, res, orderModel)
        const { Ordermongo } = getModelsByChannel(channel, res, orderOldModel)
        const { ProductMongo } = getModelsByChannel(channel, res, productModel)

        const productTable = await Product.findAll()

        const skuList = [...new Set(productTable.flatMap(item => item.sku))];

        const productMongo = await ProductMongo.find({
            sku: { $in: skuList }
        })


        let data = []

        for (const row of productTable) {

            const productExit = productMongo.find(item => item.sku === row.sku)

            if (!productExit) {


                const dataTran = {
                    id: row.id,
                    producttype: row.producttype,
                    name: row.name,
                    sku: row.sku,
                    sellprice: row.sellprice,
                    purchaseprice: row.purchaseprice,
                    stock: row.stock,
                    availablestock: row.availablestock,
                    unittext: row.unittext,
                    weight: row.weight,
                    height: row.height,
                    length: row.length,
                    width: row.width,
                    categoryid: row.categoryid,
                    category: row.category,
                    variationid: row.variationid,
                    variant: row.variant,
                    tag: row.tag,
                    sharelink: row.sharelink,
                    active: row.active,
                    properties: row.properties
                }
                data.push(dataTran)
                ProductMongo.create(dataTran)
            }
        }




        res.status(200).json({
            status: 200,
            message: 'add product success',
            data: data
        })


    } catch (error) {
        console.error(error)
        res.status(500).json({ status: '501', message: error.message })
    }
}