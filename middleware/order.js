const { v4: uuidv4 } = require('uuid');
const orderModel = require('../model/order')
const { getModelsByChannel } = require('../authen/middleware/channel')

const generateUniqueId = async (channel) => {
    let uniqueId;
    let exists;
    const { Order } = getModelsByChannel(channel, null, orderModel)
    do {
        uniqueId = parseInt(uuidv4().replace(/\D/g, "").slice(0, 9), 10);

        if (uniqueId > 2147483647) {
            uniqueId = uniqueId % 2000000000 + 100000000;
        }

        exists =
            await Order.findOne({ where: { id: uniqueId } }) 
            // ||
            // await OrderHis.findOne({ where: { id: uniqueId } });

    } while (exists);

    return uniqueId;
};

// 👉 export ตรงนี้
module.exports = generateUniqueId;
