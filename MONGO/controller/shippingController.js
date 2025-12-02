const orderModel = require('../../MONGO/models/orderMongo')
const OrderOldModel = require('../../MONGO/models/orderMongoOld')
const customerModel = require('../../MONGO/models/customerMongo')
const shippingModel = require('../../MONGO/models/shippingMongo')
const { OrderHis, OrderDetailHis, Order, OrderDetail } = require('../../zort/model/Order')
const { Customer, ShippingAddress } = require('../../zort/model/Customer')
const { Product } = require('../../zort/model/Product')
const { Op } = require('sequelize');
const { getModelsByChannel } = require('../../authen/middleware/channel')



exports.addshippingTableToMongo = async (req, res) => {
    try {
        const { type } = req.body
        const channel = req.headers['x-channel']
        const { ShippingMongo } = getModelsByChannel(channel, res, shippingModel)

        const shippingTable = await ShippingAddress.findAll()
        const orderIdList = [...new Set(shippingTable.flatMap(item => item.order_id))];
        const shippingMongo = await ShippingMongo.find({ order_id: { $in: orderIdList } })

        let data = []

        for (const row of shippingTable) {
            const shippingExit = shippingMongo.find(u => u.order_id.toString() === item.order_id.toString())
            if (!shippingExit) {
                const dataTran = {
                    shi_customerid : row.shi_customerid,
                    order_id : row.order_id,
                    shippingname : row.shippingname,
                    shippingaddress : row.shippingaddress,
                    shippingphone : row.shippingphone,
                    shippingemail : row.shippingemail,
                    shippingpostcode : row.shippingpostcode,
                    shippingprovince : row.shippingprovince,
                    shippingdistrict : row.shippingdistrict,
                    shippingsubdistrict : row.shippingsubdistrict,
                    shippingstreetAddress : row.shippingstreetAddress,
                    createdAt : row.createdAt,
                    updatedAt : row.updatedAt
                }
                data.push(dataTran)
                await ShippingMongo.create(dataTran)
            }
            
        }

        res.status(200).json({
            status : 200 ,
            message:'add shipping success',
            data :data.slice(0, 100)
        })



    } catch (error) {
        console.error(error)
        res.status(500).json({ status: '501', message: error.message })
    }
}