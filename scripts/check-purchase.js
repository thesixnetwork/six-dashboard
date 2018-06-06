const admin = require("firebase-admin");
const _ = require("lodash");
const R = require("ramda");
const axios = require("axios");
const jsonfile = require("jsonfile");
const resultFile = __dirname + "/result.json";

const configPath = __dirname + "/config/config.json";
const serviceAccount = require(configPath);

const StellarSdk = require("stellar-sdk");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://six-dashboard.firebaseio.com"
});

const db = admin.firestore();

const XLM_IS_PRODUCTION = process.env.XLM_IS_PRODUCTION;
const XLM_ADDRESS = process.env.XLM_ADDRESS;

console.log(XLM_ADDRESS);

const stellarUrl =
  XLM_IS_PRODUCTION === "true"
    ? "https://horizon.stellar.org/"
    : "https://horizon-testnet.stellar.org/";

const xlmRequest = axios.create({
  baseURL: stellarUrl
});

async function main() {
  const purchaseTxs = await listPurchaseTxs();

  const groupByType = R.groupBy(e => {
    return e.type;
  });

  const groupedTxs = groupByType(purchaseTxs);

  const checked = await Promise.all(groupedTxs.xlm.map(checkXLM));
  jsonfile.writeFile(resultFile, checked, function(err) {
    console.error(err);
  });
}

/*
 *         {
            "time": 1522693670000,
            "type": "xlm",
            "six_amount": 232.5,
            "to": "GCCOTPPCREA7E4RRT4WXB654WJRUF3U6J43CPH25544PYY5TIJNF665A",
            "memo": "0x7b226e223a32387d",
            "price_time": 1522731600000,
            "xlm_meta": {
                "tx_id": "fabc8b6c79e26737a3b7ee224c564758815371035b7dd096ed9aa194928979dd",
                "operation_id": "35382425915760641",
                "operation_number": 0
            },
            "id": "fabc8b6c79e26737a3b7ee224c564758815371035b7dd096ed9aa194928979dd_35382425915760641",
            "native_amount": 100,
            "from": "GAA2AQHTSGA3XR7F6XAQFYMGFV6RLQHXAR2XVXI5NK3YBNUPO3KV437X",
            "user_id": "gIMnGLM1AgZAdnlBzs9BAJTuwmJ3",
            "total_usd_price": 23.25
        }
*/
async function checkXLM(tx) {
  const txId = tx.xlm_meta.tx_id;

  const serverTx = await xlmRequest.get(`/transactions/${txId}`, {
    responseType: "json"
  });

  const priceTime = tx.price_time;

  const price = await getPriceOfTime("xlm", priceTime);
  if (price === null) {
    return {
      ...tx,
      result: "not found price time"
    };
  }

  const txObj = new StellarSdk.Transaction(serverTx.data.envelope_xdr);
  const amount = txObj.operations[0].amount;
  const type = txObj.operations[0].type;
  const destination = txObj.operations[0].destination;

  const sixShouldGet = (price.price * amount * 10).toFixed(7);

  let result = "";

  if (sixShouldGet !== tx.six_amount.toFixed(7)) {
    result += "not equal six recieved";
  } else if (type !== "payment") {
    result += "invalid type";
  } else if (destination !== XLM_ADDRESS) {
    result += "invalid destination";
  } else if (+amount !== +tx.native_amount) {
    result += "invalid amount";
  }
  if (result !== "") {
    return {
      ...tx,
      result
    };
  }

  return {
    ...tx,
    result: "passed"
  };
}

async function listPurchaseTxs() {
  const docRef = await db.collection("purchase_txs");
  return await docRef.get().then(snapshot => {
    const docs = [];
    snapshot.forEach(doc => {
      docs.push(doc.data());
    });
    return docs;
  });
}

async function getPriceOfTime(type, time) {
  const col = `${type}_prices`;
  const docRef = await db.collection(col).doc(time.toString());
  return await docRef.get().then(doc => {
    if (!doc.exists) {
      return null;
    } else {
      return doc.data();
    }
  });
}

main();
//this.stellarUrl = 'https://horizon-testnet.stellar.org'
//this.address = 'GDJGQJHY3FNOP7P3BBSUHDKP5NMZL7FABPCBFE7W3OTDVEHEQMVX6B32'
