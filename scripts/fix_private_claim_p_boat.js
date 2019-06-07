const updateUser1 = {
  email: "bhurit@boonrawd.co.th",
  updateClaimData: {
    5: {
      amount: 480000,
      bonus: null,
      bonus_six: null,
      normal_six: null,
      type: "Type AV",
      valid_after: 1559811600000
    }
  },
  recheck: true
};

const updateUser2 = {
  email: "swc4007@gmail.com",
  updateClaimData: {
    4: {
      amount: 600000,
      bonus: null,
      bonus_six: null,
      normal_six: null,
      type: "Type AV",
      valid_after: 1559811600000
    }
  },
  recheck: true
};

const updateUser3 = {
  email: "jonlee@yellomobile.com",
  updateClaimData: {
    4: {
      amount: 900000,
      bonus: null,
      bonus_six: null,
      normal_six: null,
      type: "Type AV",
      valid_after: 1559811600000
    }
  },
  recheck: true
};

const updateUser4 = {
  email: "sslee@yellomobile.com",
  updateClaimData: {
    5: {
      amount: 900000,
      bonus: null,
      bonus_six: null,
      normal_six: null,
      type: "Type AV",
      valid_after: 1559811600000
    }
  },
  recheck: true
};

const updateUser5 = {
  email: "khailee@500.co",
  updateClaimData: {
    5: {
      amount: 480000,
      bonus: null,
      bonus_six: null,
      normal_six: null,
      type: "Type AV",
      valid_after: 1559811600000
    }
  },
  recheck: true
};

const updateUser6 = {
  email: "tulyanond@gmail.com",
  updateClaimData: {
    8: {
      amount: 480000,
      bonus: null,
      bonus_six: null,
      normal_six: null,
      type: "Type AV",
      valid_after: 1559811600000
    }
  },
  recheck: true
};

const updateUser7 = {
  email: "kratingp@gmail.com",
  updateClaimData: {
    5: {
      amount: 480000,
      bonus: null,
      bonus_six: null,
      normal_six: null,
      type: "Type AV",
      valid_after: 1559811600000
    }
  },
  recheck: true
};

const updateUser8 = {
  email: "ceo@mfec.co.th",
  updateClaimData: {
    5: {
      amount: 480000,
      bonus: null,
      bonus_six: null,
      normal_six: null,
      type: "Type AV",
      valid_after: 1559811600000
    }
  },
  recheck: true
};

const updateUser9 = {
  email: "thanahappymail@gmail.com",
  updateClaimData: {
    4: {
      amount: 480000,
      bonus: null,
      bonus_six: null,
      normal_six: null,
      type: "Type AV",
      valid_after: 1559811600000
    }
  },
  recheck: true
};

const updateUser10 = {
  email: "thanapong.na@gmail.com",
  updateClaimData: {
    4: {
      amount: 480000,
      bonus: null,
      bonus_six: null,
      normal_six: null,
      type: "Type AV",
      valid_after: 1559811600000
    }
  },
  recheck: true
};

const updateUser11 = {
  email: "imchoi@gmail.com",
  updateClaimData: {
    4: {
      amount: 600000,
      bonus: null,
      bonus_six: null,
      normal_six: null,
      type: "Type AV",
      valid_after: 1559811600000
    }
  },
  recheck: true
};

const admin = require("firebase-admin");
const uuid = require("uuid/v5");
const configPath = __dirname + "/config/config.json";
const serviceAccount = require(configPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sixdashboard.firebaseio.com"
});
const db = admin.firestore();

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

/**
 * insert claim period
 */
async function insertClaimPeriods(periodId, uid, claimData) {
  return db
    .collection("users_claim")
    .doc(uid)
    .collection("claim_period")
    .doc(periodId)
    .set(claimData);
}

/**
 * update exists user
 */
async function updateExistUser(user) {
  console.log("----> Updating user : " + user.email);
  const uid =  `pri-${uuid(user.email, uuid.URL)}`
  return await asyncForEach(Object.keys(user.updateClaimData), async key => {
    const claimData = user.updateClaimData[key];
    return await insertClaimPeriods(key, uid, claimData);
  });
}

const start = async () => {
  console.log("======== STARTING");
  console.log("===== START UPDATE FUNCTIONING");
  await updateExistUser(updateUser1);
  await updateExistUser(updateUser2);
  await updateExistUser(updateUser3);
  await updateExistUser(updateUser4);
  await updateExistUser(updateUser5);
  await updateExistUser(updateUser6);
  await updateExistUser(updateUser7);
  await updateExistUser(updateUser8);
  await updateExistUser(updateUser9);
  await updateExistUser(updateUser10);
  await updateExistUser(updateUser11);
  console.log("===== DONE UPDATE FUNCTIONING");
  console.log("======== DONE");
  process.exit(0);
  return true;
};

start();
