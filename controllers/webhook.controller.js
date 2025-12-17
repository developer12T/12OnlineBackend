const axios = require("axios");
const { handleOrderPaid } = require("../services/webhook.service");

exports.getOrder = async (req, res) => {
  try {
    const { action } = req.params;
    const payload = req.body;

    console.log("Webhook action:", action);
    // console.log('Payload:', payload)

    switch (action) {
      case "order_created":
        console.log("order_created");
        // handle order ใหม่
        await handleOrderCreated(payload);
        break;

      case "ship":
        console.log("order_paid");
        // handle ชำระเงิน
        await handleOrderPaid(payload);
        break;

      case "cancelled":
        console.log("order_cancelled");
        // handle ยกเลิก
        // await handleOrderCancelled(payload)
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Unknown webhook action",
        });
    }

    // ต้องตอบ 200 / 201 ให้เร็ว
    res.status(200).json({ success: true, payload: payload });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ success: false });
  }
};

const TARGET_WEBHOOK_URL = "http://localhost:8383/online/bento/webhook/ship";

exports.tigger = async (req, res) => {
  try {
    const payload = {
      id: 258078337,
      number: "2511063548NE6A",
      customerid: 60351816,
      customername: "ขายช่องทาง Shopee",
      customercode: "OSPE000000",
      customeridnumber: "",
      warehousecode: "W0001",
      status: "Pending",
      paymentstatus: "Paid",
      marketplacename: null,
      marketplaceshippingstatus: null,
      marketplacepayment: null,
      shippingvat: 1,
      shippingchannel: "SPX Express",
      shippingamount_pretax: 75,
      shippingamount_vat: 4.9,
      shippingamount: 75,
      shippingdate: null,
      shippingdateString: null,
      shippingname: "น******ส",
      shippingaddress:
        "******าทรใต้ แขวง ยานนาวา แขวงยานนาวา เขตสาทร จังหวัดกรุงเทพมหานคร 10120",
      shippingphone: "******90",
      shippingemail: "",
      shippingpostcode: "10120",
      shippingprovince: "กรุงเทพมหานคร",
      shippingdistrict: "สาทร",
      shippingsubdistrict: "ยานนาวา",
      shippingstreetAddress: "******าทรใต้ แขวง ยานนาวา",
      orderdate: "2025-11-06T13:09:52",
      orderdateString: "2025-11-06",
      description: "",
      discount: 108,
      voucheramount: 108,
      discountamount: 110,
      platformdiscount_pretax: 110,
      platformdiscount_vat: 7.1962,
      platformdiscount: 110,
      sellerdiscount: 0,
      saleschannel: "Shopee",
      vattype: 3,
      vatpercent: 7,
      isCOD: false,
      createdatetime: "2025-11-06T13:09:53",
      createdatetimeString: "2025-11-06 13:09",
      updatedatetime: "2025-11-06T13:10:55",
      updatedatetimeString: "2025-11-06 13:10",
      amount: 543,
      vatamount: 35.53,
      totalproductamount: 543,
      currency: "THB",
      list: [
        {
          itemNumber: 1,
          id: 258078337,
          productid: 17824239,
          proCode: "",
          sku: "10010702005_CRT",
          itemCode: "10010702005",
          unit: "CRT",
          name: "FaThai ฟ้าไทย โฮม คิทเช่น ซอสปรุงสำเร็จรูป รสต้มยำ 75 กรัม/ซอง ( 12 ซอง)",
          quantity: 2,
          discount: 2,
          discountChanel: "Order Processing Fee - Shopee",
          pricePerUnitOri: 240,
          pricePerUnit: 239,
          totalprice: 478,
        },
        {
          itemNumber: 2,
          id: 258078337,
          productid: 17824227,
          proCode: "",
          sku: "10013701001_CRT",
          itemCode: "10013701001",
          unit: "CRT",
          name: "FaThai ฟ้าไทย ซุปน้ำ รสไก่ 25 มล. กล่อง 10 ซอง",
          quantity: 2,
          discount: 0,
          discountChanel: "",
          pricePerUnitOri: 50,
          pricePerUnit: 50,
          totalprice: 100,
        },
        {
          itemNumber: 3,
          id: 257221807,
          productid: 22804692,
          proCode: "FV2F",
          sku: "10010751001_Free",
          itemCode: "10010751001",
          unit: "PCS",
          name: "(สินค้าโปรโมชั่นแจกฟรี) FaThai ฟ้าไทย ฮอทพอท น้ำซุปต้มยำเข้มข้น 120 มล. (1 ซอง)",
          quantity: 1,
          discount: 0,
          discountChanel: "",
          pricePerUnitOri: 0,
          pricePerUnit: 0,
          totalprice: 0,
        },
        {
          itemNumber: 4,
          id: 257221807,
          productid: 9999999,
          proCode: "",
          sku: "ZNS1401001_JOB",
          itemCode: "ZNS1401001",
          unit: "JOB",
          name: "ค่าขนส่ง",
          quantity: 1,
          discount: 0,
          discountChanel: "",
          pricePerUnitOri: 75,
          pricePerUnit: 75,
          totalprice: 75,
        },
        {
          itemNumber: 5,
          id: 257221807,
          productid: 20346878,
          proCode: "FV2P",
          sku: "600102390_Premium",
          itemCode: "600102390",
          unit: "PCS",
          name: "(สินค้าแจกฟรีโปรโมชั่น) แก้วเก็บความเย็นฟ้าไทย 1 ใบ",
          quantity: 1,
          discount: 0,
          discountChanel: "",
          pricePerUnitOri: 0,
          pricePerUnit: 0,
          totalprice: 0,
        },
      ],
    };
    // console.log(payload)

    const response = await axios.post(TARGET_WEBHOOK_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Signature": "mock-signature-123", // ถ้ายังไม่ verify ก็ใส่ไว้เฉยๆ
      },
      timeout: 5000,
    });

    res.json({
      success: true,
      message: "Webhook sent",
      webhookResponse: response.data,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
