const orderModel = require('../../model/mongo/orderMongo')


exports.addOrderToMongo = async (req, res) => { 
    try {
        
    const channel = req.headers['x-channel']
    const { Order } = getModelsByChannel(channel, res, orderModel)
    let products = await Order.find({}, { _id: 0, __v: 0 }).lean()

    res.status(200).json({
        status:200,
        message:'addproduct success',
        data
    })


    } catch (error) {
    console.error(error)
    res.status(500).json({ status: '501', message: error.message })
    }
}