const fs = require("fs");
const rp = require("request-promise");
const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://six-dashboard.firebaseio.com"
});

const fireStore = admin.firestore();

let first = new Date(1521993600000);

const now = new Date();

console.log("first: ", first);
let next = first;

const link = (coin, ts) =>
  `https://min-api.cryptocompare.com/data/pricehistorical?fsym=${coin.toUpperCase()}&tsyms=USD&ts=${ts /
    1000}`;

const pc = (myVal, source) => (source - myVal) / source * 100;

let count = {};
let missingDate = [];
let total = [];
const tier = [50, 25, 15, 10, 3];

for (let t of tier) {
  count[t] = [];
}

async function main(coin) {
  let ref = fireStore.collection(`${coin}_prices`);

  while (next < now) {
    next = new Date(first.setHours(first.getHours() + 1));
    next = next.getTime();

    const r2 = rp(link(coin, next));
    const r1 = ref.doc(next + "").get();

    const doc = await r1;
    let body = await r2;
    body = JSON.parse(body);

    // myVal
    if (!doc.data()) {
      console.log("############# missing data", next);
      console.log();
      missingDate.push(next);
      continue;
    }
    let { price: myVal } = doc.data();

    // price
    const price = body[coin.toUpperCase()].USD;

    const result = pc(myVal, price);

    console.log("next", next);
    console.log("link", link(coin, next));
    console.log(`doc: ${myVal} price: ${price}`);
    console.log(`${result} %`);

    let per = Math.abs(result);

    for (let t of tier) {
      if (per / t >= 1) {
        count[t].push({
          ts: next,
          myVal: myVal,
          ori: price
        });
        break;
      }
    }

    total.push({
      ts: next,
      myVal: myVal,
      ori: price,
      percent_change: result,
    })

    console.log();
  }
}

const COIN = "xlm";

main(COIN)
  .then(() => {
    for (let t of tier) {
      console.log(JSON.stringify(count[t], null, 2));
      fs.writeFileSync(
        `./${COIN}/data_${t}.json`,
        JSON.stringify(count[t], null, 2)
      );
    }
    for (let t of tier) {
      console.log(t, count[t].length);
      fs.writeFileSync(`./${COIN}/count_${t}.txt`, `count_${t}%: ${count[t].length} `);
    }
    fs.writeFileSync(`./${COIN}/missing.txt`, `${missingDate}`);
    fs.writeFileSync(`./${COIN}/data.json`, JSON.stringify(total, null, 2));
    console.log(missingDate, "done");
  })
  .catch(err => console.log(err));
