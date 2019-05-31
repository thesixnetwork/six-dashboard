  
const admin = require('firebase-admin');
const uuid = require('uuid/v5');
const configPath = __dirname + '/config/config.json';
const serviceAccount = require(configPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sixdashboard.firebaseio.com',
});
const db = admin.firestore();

one_email = ["bkchoi@yellomobile.com", "bjjong@fsn.co.kr", "ldy@adqua.co.kr", "dhkim@adqua.co.kr", "thinkership@adqua.co.kr", "jihoons@fsn.co.kr", "jeundyj@daum.net", "junelee@adqua.co.kr", "adored0@naver.com", "onlymr@adqua.co.kr", "dalnorae@groupidd.com", "fromp@adqua.co.kr", "seungho.lee@yellomobile.com", "june@adqua.co.kr", "ysook@groupidd.com", "kurt@groupidd.com", "loveme610@motherbrain.co.kr", "remeet@ydmbuzz.com", "arak.sutivong@gmail.com", "ojazzy@gmail.com", "nuttapong.tc@gmail.com", "charkrid@gmail.com", "charn@taamkru.com", "harpremdoowa@gmail.com", "pattawan.j@taokaenoi.co.th", "sudatip.piyavee@gmail.com", "nbhirombhakdi213@gmail.com", "nintita@smartcoating.com", "pippo41@gmail.com", "natthakit.susanthitanon@gmail.com", "suthijoe@gmail.com", "buffalo660@gmail.com", "sukumwhut@gmail.com", "nraktaprachit@gmail.com", "naphat12@hotmail.com", "settaporn.s@gmail.com", "teenoybu2@gmail.com", "sarun@fungjai.com", "ricky@nvk.co.th", "polapat@ookbee.com", "alaaum@hotmail.com", "cprapon@gmail.com", "iphong@uw.edu", "safefy@gmail.com", "siwat.tee34@gmail.com", "wasita.ra135@gmail.com", "genatorster@gmail.com", "bee4000@hotmail.com", "ooknew55@gmail.com", "sahmzheii@gmail.com", "uuu.naja@gmail.com", "divinitysex@gmail.com", "passakorn.sub@gmail.com", "yellowisdad@gmail.com", "fireboat999@hotmail.com", "arokung@gmail.com", "note@ookbee.com", "vasupol@ookbee.com", "pattanan.bp@gmail.com", "ekamorn.012@gmail.com", "dorracha.ch@gmail.com", "iprewlome@gmail.com", "chromogafee@gmail.com", "korakot@ookbee.com", "padthamapp@gmail.com", "laddawanna@gmail.com", "chareef17@gmail.com", "screening1@gmail.com", "nattipat@ookbee.com", "bebick@hotmail.com", "lps.j18@gmail.com", "karnraweewong@gmail.com", "warakorn9z@gmail.com", "piyanggoon93@gmail.com", "sarawee_b@hotmail.com", "natchyyyy@gmail.com", "chaiyasit.u@gmail.com", "top_tap@msn.com", "chinnapat.b@gmail.com", "nrongsakdi@gmail.com", "kanjana.ji@yahoo.com", "pianp.jsw@gmail.com", "phannisa.hs@gmail.com", "chawapol@cmg.co.th", "r.muangkroot@gmail.com", "tsudchai@gmail.com", "tim.chae@gmail.com", "sompoat@icloud.com", "dimpleart@gmail.com", "chawisa.chen@gmail.com", "vorapat_c@boonrawd.co.th", "warokart@gmail.com", "vchavana@gmail.com", "chatchaik@gmail.com", "avudh.ploy@gmail.com", "k.atcharakitti@gmail.com", "pongsatorn@g-tem.com", "porntip@pacrimgroup.com", "d_ladawan@doublea1991.com", "yos.ginting@gmail.com", "kawayanagik@hotmail.com", "wongchindawest@gmail.com", "ekarin.th@gmail.com", "polapat@gmail.com", "natavudh@gmail.com", "sangboon@gmail.com", "mig09@hotmail.com", "pakpoom.s@gmail.com", "sam.tanskul@yahoo.com", "vachara@computerlogy.com", "tanapon@adyim.com", "itthi.yossundara@gmail.com", "watcharapong@six.network", "ayoungh@gmail.com", "brian@formationgroup.com", "chcho@fsn.co.kr", "donaldck@fsn.co.kr", "andy.chiwon.kim@gmail.com", "first030@yellomobile.com", "dkchang@yellostory.co.kr", "pabijoa2@naver.com", "rudtlr1098@hanmail.net", "jin7370@gmail.com", "tonyhong1004@naver.com", "lon2001@hanmail.net", "inhwanc@gmail.com", "nonesmoking@naver.com", "jkh9336@gmail.com", "zephaniah@naver.com", "eun289k@gmail.com", "angelcee@naver.com", "noamsaid@gmail.com", "slhlove333@naver.com", "helper@madsq.net", "jooyi.kang@gmail.com", "happyjuhwa@naver.com", "jungwoo.jang@hotmail.com", "jungdonoh.apply@gmail.com", "jaysuk@yellomobile.com", "kman0204@naver.com", "knamjin@ysmcorp.com", "kim.kishik@gmail.com", "angus_kim@naver.com", "andrewleekr@naver.com", "crossover3737@gmail.com", "kimnamchul@daum.net", "neochg@naver.com", "lae@formationgroup.com", "sh.ahn@daylifg.com", "john.sejunkim@gmail.com", "seanshs@naver.com", "sijung00@gmail.com", "david.baik@groupidd.com", "cordiallys@gmail.com", "ryoosunghoon@naver.com", "ssshwan@naver.com", "sunghyuk.dave.park@gmail.com", "sfkim@yellomobile.com", "remeet@naver.com", "yjung@yellostory.co.kr", "airboom77@hanmail.net", "starbae@gmail.com", "das412@hanmail.net", "moo@ookbee.com", "bradshin@fsn.co.kr", "andrew@yellomobile.com", "leo@ad-max.co.kr", "peter@mediance.co.kr", "sykim@yellostory.co.kr", "dave.park@recobell.com", "sunnhlee@hanmail.net", "01692216665@naver.com", "suchada@favstay.com", "dk@blueblock.co", "saber.aria@gmail.com", "joon8129@gmail.com", "ys.shin@intervest.co.kr", "morikawa@cchan.tv", "korn.chatikavanij@gmail.com", "min.kim@daylifg.com", "phawit.chi@gmmgrammy.com", "thakorn.piyapan@krungsri.com", "vincent.ha@gushcloud.com", "jirath@ignite.co.th", "siwat@siwat.com", "knamjin@yellomobile.com", "daylifinancial@daylifg.com", "charkrid@six.network", "nisanart@six.network"]

dup_email = ["ykikicom@gmail.com", "until99@gmail.com", "chc@adqua.co.kr", "head@motherbrain.co.kr", "bl0323@adqua.co.kr", "jjy7942@hanmail.net", "mike.hwang@recobell.com", "hamans@hanmail.net<feff>", "sagac@daum.net", "shlee@yellomobile.com", "sslee@yellomobile.com", "chonju2002@naver.com", "smpark@adqua.co.kr", "bhurit@boonrawd.co.th", "tulyanond@gmail.com", "khailee@500.co", "kratingp@gmail.com", "ceo@mfec.co.th", "voraphun.t@gmail.com", "ariya.banomyong@gmail.com", "tplim@pacrimgroup.com", "swc4007@gmail.com", "imchoi@gmail.com", "thanahappymail@gmail.com", "thanapong.na@gmail.com", "vachara@six.network", "jonlee@yellomobile.com", "natavudh@six.network", "ha501136@gmail.com", "sangboon@itworks.co.th"]

all_email = ["bkchoi@yellomobile.com", "bjjong@fsn.co.kr", "ykikicom@gmail.com", "ldy@adqua.co.kr", "dhkim@adqua.co.kr", "thinkership@adqua.co.kr", "until99@gmail.com", "chc@adqua.co.kr", "head@motherbrain.co.kr", "bl0323@adqua.co.kr", "jihoons@fsn.co.kr", "jjy7942@hanmail.net", "jeundyj@daum.net", "junelee@adqua.co.kr", "adored0@naver.com", "mike.hwang@recobell.com", "onlymr@adqua.co.kr", "dalnorae@groupidd.com", "hamans@hanmail.net﻿", "sagac@daum.net", "shlee@yellomobile.com", "sslee@yellomobile.com", "fromp@adqua.co.kr", "seungho.lee@yellomobile.com", "june@adqua.co.kr", "chonju2002@naver.com", "ysook@groupidd.com", "kurt@groupidd.com", "loveme610@motherbrain.co.kr", "smpark@adqua.co.kr", "remeet@ydmbuzz.com", "arak.sutivong@gmail.com", "ojazzy@gmail.com", "bhurit@boonrawd.co.th", "nuttapong.tc@gmail.com", "charkrid@gmail.com", "charn@taamkru.com", "harpremdoowa@gmail.com", "pattawan.j@taokaenoi.co.th", "tulyanond@gmail.com", "khailee@500.co", "sudatip.piyavee@gmail.com", "nbhirombhakdi213@gmail.com", "nintita@smartcoating.com", "pippo41@gmail.com", "natthakit.susanthitanon@gmail.com", "suthijoe@gmail.com", "buffalo660@gmail.com", "sukumwhut@gmail.com", "nraktaprachit@gmail.com", "naphat12@hotmail.com", "settaporn.s@gmail.com", "teenoybu2@gmail.com", "sarun@fungjai.com", "ricky@nvk.co.th", "polapat@ookbee.com", "alaaum@hotmail.com", "cprapon@gmail.com", "iphong@uw.edu", "safefy@gmail.com", "siwat.tee34@gmail.com", "wasita.ra135@gmail.com", "genatorster@gmail.com", "bee4000@hotmail.com", "ooknew55@gmail.com", "sahmzheii@gmail.com", "uuu.naja@gmail.com", "divinitysex@gmail.com", "passakorn.sub@gmail.com", "yellowisdad@gmail.com", "fireboat999@hotmail.com", "arokung@gmail.com", "note@ookbee.com", "vasupol@ookbee.com", "pattanan.bp@gmail.com", "ekamorn.012@gmail.com", "dorracha.ch@gmail.com", "iprewlome@gmail.com", "chromogafee@gmail.com", "korakot@ookbee.com", "padthamapp@gmail.com", "laddawanna@gmail.com", "chareef17@gmail.com", "screening1@gmail.com", "nattipat@ookbee.com", "bebick@hotmail.com", "lps.j18@gmail.com", "karnraweewong@gmail.com", "warakorn9z@gmail.com", "piyanggoon93@gmail.com", "sarawee_b@hotmail.com", "natchyyyy@gmail.com", "chaiyasit.u@gmail.com", "top_tap@msn.com", "chinnapat.b@gmail.com", "nrongsakdi@gmail.com", "kanjana.ji@yahoo.com", "pianp.jsw@gmail.com", "phannisa.hs@gmail.com", "chawapol@cmg.co.th", "r.muangkroot@gmail.com", "kratingp@gmail.com", "ceo@mfec.co.th", "tsudchai@gmail.com", "tim.chae@gmail.com", "sompoat@icloud.com", "dimpleart@gmail.com", "chawisa.chen@gmail.com", "vorapat_c@boonrawd.co.th", "voraphun.t@gmail.com", "warokart@gmail.com", "ariya.banomyong@gmail.com", "vchavana@gmail.com", "chatchaik@gmail.com", "avudh.ploy@gmail.com", "k.atcharakitti@gmail.com", "pongsatorn@g-tem.com", "tplim@pacrimgroup.com", "tplim@pacrimgroup.com", "porntip@pacrimgroup.com", "d_ladawan@doublea1991.com", "yos.ginting@gmail.com", "kawayanagik@hotmail.com", "wongchindawest@gmail.com", "bhurit@boonrawd.co.th", "swc4007@gmail.com", "ekarin.th@gmail.com", "tulyanond@gmail.com", "tulyanond@gmail.com", "khailee@500.co", "polapat@gmail.com", "natavudh@gmail.com", "sangboon@gmail.com", "mig09@hotmail.com", "pakpoom.s@gmail.com", "kratingp@gmail.com", "ceo@mfec.co.th", "imchoi@gmail.com", "sam.tanskul@yahoo.com", "thanahappymail@gmail.com", "thanapong.na@gmail.com", "vachara@six.network", "vachara@computerlogy.com", "tanapon@adyim.com", "itthi.yossundara@gmail.com", "voraphun.t@gmail.com", "watcharapong@six.network", "voraphun.t@gmail.com", "ariya.banomyong@gmail.com", "ayoungh@gmail.com", "brian@formationgroup.com", "ykikicom@gmail.com", "chcho@fsn.co.kr", "donaldck@fsn.co.kr", "andy.chiwon.kim@gmail.com", "first030@yellomobile.com", "dkchang@yellostory.co.kr", "pabijoa2@naver.com", "rudtlr1098@hanmail.net", "jin7370@gmail.com", "until99@gmail.com", "tonyhong1004@naver.com", "chc@adqua.co.kr", "lon2001@hanmail.net", "inhwanc@gmail.com", "nonesmoking@naver.com", "head@motherbrain.co.kr", "jkh9336@gmail.com", "zephaniah@naver.com", "eun289k@gmail.com", "bl0323@adqua.co.kr", "angelcee@naver.com", "jjy7942@hanmail.net", "noamsaid@gmail.com", "slhlove333@naver.com", "helper@madsq.net", "jooyi.kang@gmail.com", "happyjuhwa@naver.com", "jungwoo.jang@hotmail.com", "jungdonoh.apply@gmail.com", "jaysuk@yellomobile.com", "kman0204@naver.com", "knamjin@ysmcorp.com", "kim.kishik@gmail.com", "angus_kim@naver.com", "andrewleekr@naver.com", "crossover3737@gmail.com", "mike.hwang@recobell.com", "jonlee@yellomobile.com", "kimnamchul@daum.net", "neochg@naver.com", "lae@formationgroup.com", "hamans@hanmail.net﻿", "sagac@daum.net", "sh.ahn@daylifg.com", "shlee@yellomobile.com", "sslee@yellomobile.com", "john.sejunkim@gmail.com", "seanshs@naver.com", "sijung00@gmail.com", "david.baik@groupidd.com", "cordiallys@gmail.com", "ryoosunghoon@naver.com", "ssshwan@naver.com", "sunghyuk.dave.park@gmail.com", "sfkim@yellomobile.com", "remeet@naver.com", "yjung@yellostory.co.kr", "chonju2002@naver.com", "airboom77@hanmail.net", "starbae@gmail.com", "das412@hanmail.net", "vachara@six.network", "natavudh@six.network", "moo@ookbee.com", "bradshin@fsn.co.kr", "andrew@yellomobile.com", "leo@ad-max.co.kr", "smpark@adqua.co.kr", "peter@mediance.co.kr", "sykim@yellostory.co.kr", "dave.park@recobell.com", "sunnhlee@hanmail.net", "ha501136@gmail.com", "chonju2002@naver.com", "01692216665@naver.com", "suchada@favstay.com", "dk@blueblock.co", "saber.aria@gmail.com", "joon8129@gmail.com", "ys.shin@intervest.co.kr", "bl0323@adqua.co.kr", "chc@adqua.co.kr", "ha501136@gmail.com", "sangboon@itworks.co.th", "sangboon@itworks.co.th", "sangboon@itworks.co.th", "sangboon@itworks.co.th", "sangboon@itworks.co.th", "sangboon@itworks.co.th", "", "morikawa@cchan.tv", "bhurit@boonrawd.co.th", "", "swc4007@gmail.com", "jonlee@yellomobile.com", "khailee@500.co", "korn.chatikavanij@gmail.com", "min.kim@daylifg.com", "phawit.chi@gmmgrammy.com", "kratingp@gmail.com", "ceo@mfec.co.th", "", "thakorn.piyapan@krungsri.com", "thanahappymail@gmail.com", "thanapong.na@gmail.com", "vincent.ha@gushcloud.com", "jirath@ignite.co.th", "imchoi@gmail.com", "", "siwat@siwat.com", "knamjin@yellomobile.com", "daylifinancial@daylifg.com", "", "", "", "natavudh@six.network", "vachara@six.network", "charkrid@six.network", "nisanart@six.network"]

one_ids = {}

async function getUIDByEmail(email) {
  return admin
    .auth()
    .getUserByEmail(email)
    .then(userRecord => userRecord.uid)
    .catch(() => false);
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

test_email = ["hamans@hanmail.net"]
sum_data = {}
const start = async () => {
  await asyncForEach(test_email, async (email) => {
    const uid = await getUIDByEmail(email)
    console.log(uid)
    try {
      const docs = await db.collection('users_claim').doc(uid).collection('claim_period').get()
      let data = []
      let allClaimed = true
      docs.forEach(doc => {
        if (doc.data().type !== 'free' && !!doc.data().transaction_id) data.push(doc.data().transaction_id)
        if (doc.data().type !== 'free' && doc.data().claimed !== true) allClaimed = false
      })
      console.log(data)
      //console.log(email + "\t" + uid + "\t" + data.join(","))
      console.log(email)
      sum_data[email] = uid + "\t" + data.join(",") + "\t" + allClaimed
    } catch(error) {
      console.log(error)
    }
  });
  console.log(sum_data)
  await asyncForEach(all_email, async (email) => {
    const message = sum_data[email]// || ""
    console.log(email + "\t" + message)
  })
  console.log('Done');
}

//const start = async () => {
//  await asyncForEach(dup_email, async (email) => {
//    const uid = await getUIDByEmail(email)
//    try {
//      const docs = await db.collection('users_claim').doc(uid).collection('claim_period').get()
//      let dataType = {}
//      let claimAll = {}
//      docs.forEach(doc => {
//        if (!dataType[doc.data().type]) dataType[doc.data().type] = []
//        if (claimAll[doc.data().type] === undefined) claimAll[doc.data().type] = true
//        if (doc.data().type !== "free" && doc.data().claimed === true) dataType[doc.data().type].push(doc.data().transaction_id)
//        if (doc.data().type !== "free" && doc.data().claimed !== true) {
//          claimAll[doc.data().type] = false
//        }
//        //console.log(email + "\t" + uid + "\t" + doc.data().transaction_id + "\t" + doc.data().amount)
//      })
//      Object.keys(dataType).forEach(key => {
//        if (key !== 'free') console.log(email + "\t" + uid + "\t" + dataType[key].join(",") + "\t" + claimAll[key])
//      })
//      //console.log(email + "\t" + uid + "\t" + data.join(","))
//      //console.log(email)
//      //sum_data[email] = uid + "\t" + data.join(",")
//    } catch(error) {
// //     console.log(error)
//    }
//  });
//  //await asyncForEach(all_email, async (email) => {
//  //  const message = sum_data[email] || ""
//  //  console.log(email + "\t" + message)
//  //})
//  console.log('Done');
//}

start();
