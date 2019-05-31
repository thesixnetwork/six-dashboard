const admin = require('firebase-admin');
const configPath = __dirname + '/config/config.json';
const serviceAccount = require(configPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sixdashboard.firebaseio.com',
});

const db = admin.firestore();

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

const errorIds = []
const start = async () => {
  const users = await db.collection('users').get();
  const userArray = [];
  users.forEach(user => {
    userArray.push(user);
  });
  await asyncForEach(userArray, async user => {
    try {
      const claims = await db
        .collection('users_claim')
        .doc(user.id)
        .collection('claim_period')
        .get();
      const claimArray = [];
      claims.forEach(claim => {
        claimArray.push(claim);
      });
      await asyncForEach(claimArray, async claim => {
        const claimData = claim.data();
        const userData = user.data();
        console.log(
          user.id +
            '\t' +
            userData.first_name +
            '\t' +
            userData.last_name +
            '\t' +
            userData.email +
            '\t' +
            userData.phone_number +
            '\t' +
            (userData.xlm_address || '') +
            '\t' +
            claimData.type +
            '\t' +
            claimData.amount +
            '\t' +
            (claimData.claimed || false) +
            '\t' +
            (claimData.transaction_id || ''),
        );
      });
    } catch (error) {
      errorIds.push(user.id)
    }
  });
  console.log('done');
  console.log(errorIds)
};

start();
