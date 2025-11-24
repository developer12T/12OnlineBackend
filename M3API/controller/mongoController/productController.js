const productModel = require('../../model/mongo/productMongo')


exports.addProduct = async (req, res) => { 
    try {
        
    const channel = req.headers['x-channel']
    const { Product } = getModelsByChannel(channel, res, productModel)
    let products = await Product.find({}, { _id: 0, __v: 0 }).lean()

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