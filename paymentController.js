const nodeCCAvenue = require("node-ccavenue");
require("dotenv").config();
const CryptoJS = require("crypto-js");

const handlePaymentControllerPhone = async (req) => {
  try {
    const ccav = new nodeCCAvenue.Configure({
      access_code: process.env.access_code,
      working_key: process.env.working_key,
      merchant_id: process.env.MERCHANT_ID,
    });
    const orderParams = {
      redirect_url: encodeURIComponent(
        `http://192.168.1.36:3000/api/response?access_code=${process.env.access_code}&working_key=${process.env.working_key}`
      ),
      cancel_url: encodeURIComponent(`https://aquadrop.in/failure`),
      currency: "INR",
      ...req.body.orderParams,
    };
    const encryptedOrderData = ccav.getEncryptedOrder(orderParams);
    return {
      payLink: `https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction&access_code=${process.env.access_code}&encRequest=${encryptedOrderData}`,
    };
  } catch (err) {
    console.log(err);
  }
};

const handleResponsePaymentController = async (req, res, next) => {
  console.log("ghus gye");
  try {
    var encryption = req.body.encResp;
    const ccav = new nodeCCAvenue.Configure({
      ...req.query,
      merchant_id: process.env.MERCHANT_ID,
    });
    var ccavResponse = ccav.redirectResponseToJson(encryption);
    var ciphertext = CryptoJS.AES.encrypt(
      JSON.stringify(ccavResponse),
      "Astro"
    ).toString();
    console.log(ccavResponse);
    if (ccavResponse["order_status"] == "Success") {
      console.log("success");
      res.redirect(`https://aquadrop.in/success`);
    } else {
      res.redirect(`https://aquadrop.in/failure`);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handlePaymentControllerPhone,
  handleResponsePaymentController,
};
