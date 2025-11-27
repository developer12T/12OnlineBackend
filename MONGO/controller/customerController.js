const { Customer } = require('../../zort/model/Customer')
const { Op } = require('sequelize');
const { getModelsByChannel } = require('../../authen/middleware/channel')
const customerModel = require('../../MONGO/models/customerMongo')


exports.addCustomerTableToMongo = async (req, res) => {
    try {
        const channel = req.headers['x-channel']
        const { CustomerMongo } = getModelsByChannel(channel, res, customerModel)

        const customerTable = await Customer.findAll({});
        const customerTableList = [
            ...new Set(
                customerTable
                    .flatMap(item => item.customerid)
                    .filter(id => id !== null && id !== undefined && id !== '')
            )
        ];
        const customerMongo = await CustomerMongo.find({
            customerid: { $in: customerTableList }
        })


        let data = []

        for (const row of customerTable) {

            if (!row.customerid) continue;

            const customerExit = customerMongo.find(item => item.customerid.toString() === row.customerid.toString())



            if (!customerExit) {
                const dataTran = {
                    autoCusId: row.autoCusId,
                    customerid: row.customerid,
                    customeriderp: row.customeriderp,
                    customername: row.customername,
                    customercode: row.customercode,
                    customeridnumber: row.customeridnumber,
                    customeremail: row.customeremail,
                    customerphone: row.customerphone,
                    customeraddress: row.customeraddress,
                    customerpostcode: row.customerpostcode,
                    customerprovince: row.customerprovince,
                    customerdistrict: row.customerdistrict,
                    customersubdistrict: row.customersubdistrict,
                    customerstreetAddress: row.customerstreetAddress,
                    customerbranchname: row.customerbranchname,
                    customerbranchno: row.customerbranchno,
                    facebookname: row.facebookname,
                    facebookid: row.facebookid,
                    line: row.line,
                    lineid: row.lineid,
                    createddate: row.createddate
                }
                data.push(dataTran)
                CustomerMongo.create(dataTran)

            }

        }

        res.status(200).json({
            status: 200,
            message: 'Add customer success',
            data: data,
            // data: customerTableList
        })


    } catch (error) {
        console.error(error)
        res.status(500).json({ status: '501', message: error.message })
    }
} 