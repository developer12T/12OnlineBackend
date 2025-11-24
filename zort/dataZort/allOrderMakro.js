const axios = require('axios');

const orderMakroAll = async (req, res) => {
    try {
        
            // https://maknet-prod.mirakl.net/api/orders?order_state_codes=SHIPPING&max=100&offset=0&order=asc
        const response = await axios.get(process.env.urlMakro + '/api/orders?order_state_codes=SHIPPING&max=100&offset=0&order=asc', {
            // const response = await axios.get(process.env.urlMakro + '/api/orders?start_date=2025-03-13T11:00:00Z&end_date=2025-03-15T00:00:00Z', {
            // const response = await axios.get(process.env.urlMakro + '/api/orders?order_ids=MAKROPRO15874203B', {
            headers: {
                Accept: 'application/json',
                Authorization: process.env.frontKeyMakro
            },
        },);

        let maxLoop =Math.ceil(response.data.total_count / 100);
        let allOrders = [...response.data.orders];
        let totalCount = response.data.total_count;
        if(maxLoop <= 1){
            return response.data;
        }else{
            for (let i = 1; i < maxLoop; i++) {
                let offset = i * 100;
                const res = await axios.get(
                    `${process.env.urlMakro}/api/orders?order_state_codes=SHIPPING&max=100&offset=${offset}&order=asc`,
                    {
                      headers: {
                        Accept: 'application/json',
                        Authorization: process.env.frontKeyMakro
                      }
                    }
                  );
              
                  allOrders.push(...res.data.orders);
            }

            const finalData = {
                orders: allOrders,
                total_count: totalCount
              };
            return finalData
            
        }

      
    } catch (error) {
        console.error(error);
        res.json({ error: 'Internal server error' });
    }
};

module.exports = orderMakroAll;