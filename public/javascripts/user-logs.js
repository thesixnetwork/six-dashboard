// global user data
userData = {};

currentFocus = ""
var currentIp = ""
var currentStatus = 'all'
// Logout function to sign user out
function logOut() {
  firebase.auth().signOut();
}

// Initialize admin to check if user is admin
function initializeAdmin() {
  let promise = new Promise(function(resolve, reject) {
    let db = firebase.firestore();
    db
      .collection("admins")
      .get()
      .then(() => {
        resolve();
      })
      .catch(() => {
        reject();
      });
  });
  return promise;
}

// Crea element
function createElementFromHTML(htmlString) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return div;
}

// Build kyc user list element
function buildListUser(doc) {
  const { timeStamp, email, uid, diffValues, walletChanged, walletChangeData } = doc
  let date = new Date((timeStamp + 3600 * 7) * 1000);

  var tr = document.createElement("tr");
  var td1 = document.createElement("td");
  var txt1 = document.createTextNode(uid)
  td1.appendChild(txt1);
  // email
  var td2 = document.createElement("td");
  var txt2 = document.createTextNode(email);
  td2.appendChild(txt2);
  // edt fiele
  var td3 = document.createElement("td");
  var txt3 = document.createTextNode('');
      // changed fields
  let changeText = ''
  for (let diff of diffValues) {
    const text = `Field: "${diff.field}", from: "${diff.oldData}", to: "${diff.newData}" `
    const span = td3.appendChild(document.createElement("span"));
    span.appendChild(document.createTextNode('Field: '));
    const span2 = td3.appendChild(document.createElement("span"));
    span2.className = "blue"
    span2.appendChild(document.createTextNode(`"${diff.field}"`));
    const span3 = td3.appendChild(document.createElement("span"));
    span3.appendChild(document.createTextNode(' From: '));
    const span4 = td3.appendChild(document.createElement("span"));
    span4.className = "red"
    span4.appendChild(document.createTextNode(`"${diff.oldData}"`));
    const span5 = td3.appendChild(document.createElement("span"));
    span5.appendChild(document.createTextNode(' To: '));
    const span6 = td3.appendChild(document.createElement("span"));
    span6.className = "green"
    span6.appendChild(document.createTextNode(`"${diff.newData}"`));
    td3.appendChild(document.createElement("br"));
    td3.appendChild(document.createElement("br"));
  }
  td3.appendChild(txt3);
  // address change
  var td4 = document.createElement("td");
  var txt4 = document.createTextNode('');
  if (walletChanged) {
    // let addressChangeText = `from: ${addressChangeData.oldData}, to: ${addressChangeData.newData}`
    const span1 = td4.appendChild(document.createElement("span"));
    span1.appendChild(document.createTextNode(' From: '));
    const span2 = td4.appendChild(document.createElement("span"));
    span2.className = "red"
    span2.appendChild(document.createTextNode(`"${walletChangeData.oldData}"`));
    const span3 = td4.appendChild(document.createElement("span"));
    span3.appendChild(document.createTextNode(' To: '));
    const span4 = td4.appendChild(document.createElement("span"));
    span4.className = "green"
    span4.appendChild(document.createTextNode(`"${walletChangeData.newData}"`));
    td3.appendChild(document.createElement("br"));
    td3.appendChild(document.createElement("br"));
  }
  td4.appendChild(txt4);
  var td5 = document.createElement("td");
  var txt5 = document.createTextNode(moment(new Date(parseInt(timeStamp))).format('DD/MM/YYYY HH:mm:ss'));
  td5.appendChild(txt5);
  tr.appendChild(td1);
  tr.appendChild(td2);
  tr.appendChild(td3);
  tr.appendChild(td4);
  tr.appendChild(td5);
  return tr
}

function difference(object, base) {
	function changes(object, base) {
		return _.transform(object, function(result, value, key) {
			if (!_.isEqual(value, base[key])) {
				result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
			}
		});
	}
	return changes(object, base);
}

// Initialize database to query data and draw to view
function initializeDatabase2(status) {
  let promise = new Promise(function(resolve, reject) {
    $("#adminList").empty()
    let db = firebase.database().ref(`logs/`);
    db
      .on('value', snapshot => {
        const data = snapshot.val()
        const timeStamps = Object.keys(data)
        const logs = _.toArray(data)
        $("#adminList").empty()
        let allLogs = []
        for (let [index, log] of logs.entries()) {
          const { document, oldDocument } = log
          const { uid, email } = oldDocument
          const diff = difference(document, oldDocument)
          const diffKeys = Object.keys(diff)
          let diffValues = []
          let walletChanged = false
          let walletChangeData = null
          for (let diffKey of diffKeys) {
            const newData = document[diffKey]
            const oldData = oldDocument[diffKey]
            if (diffKey !== 'eth_wallet') {
              diffValues.push({
                newData,
                oldData,
                field: diffKey
              })
            } else {
              walletChanged = true
              walletChangeData = {
                newData,
                oldData,
                field: diffKey
              }
            }
          }
          allLogs.push({
            uid,
            email,
            diffValues,
            timeStamp: timeStamps[index],
            walletChangeData,
            walletChanged
          })
        }
        allLogs.sort((a, b) => b.timeStamp - a.timeStamp)
        for (let log of allLogs) {
          let elem = buildListUser(log)
          $("#adminList")[0].appendChild(elem)
        }
        resolve();
      })
  });
  return promise;
}

let firstDoc = null
let endAt = null
let startAt = []
let fistItemOnNext = null

function prevLogs () {
  $("#adminList").empty()
  const target = startAt[startAt.length - 2]
  let db = firebase.firestore()
    .collection(`users_log`)
    .orderBy('timestamp', 'desc')
    .startAt(target)
    .limit(20)
  const first = db.get()
  .then(docs => {
    const all = docs.docs.length
    let allLogs = []
    const last = docs.docs.length - 1
    // startAt = docs.docs[0]
    endAt = docs.docs[last];
    startAt.pop()
    if (target.id == firstDoc.id) {
      $('#prevBtn').prop('disabled', true);
    }
    docs.forEach(doc => {
      const log = doc.data()
      const { document, oldDocument, timestamp } = log
      const { uid, email } = oldDocument
      const diff = difference(document, oldDocument)
      const diffKeys = Object.keys(diff)
      let diffValues = []
      let walletChanged = false
      let walletChangeData = null
      diffKeys.forEach(diffKey => {
        const newData = document[diffKey]
        const oldData = oldDocument[diffKey]
        if (diffKey !== 'eth_wallet') {
          const injectData = {
            newData,
            oldData,
            field: diffKey
          }
          diffValues.push(injectData)
        } else {
          walletChanged = true
          walletChangeData = {
            newData,
            oldData,
            field: diffKey
          }
        }
      })
      allLogs.push({
        uid,
        email,
        diffValues,
        timeStamp: timestamp,
        walletChangeData,
        walletChanged
      })
    })
    // allLogs.sort((a, b) => b.timeStamp - a.timeStamp)
    for (let log of allLogs) {
      let elem = buildListUser(log)
      $("#adminList")[0].appendChild(elem)
    }
  })
}

function nextLogs () {
  $('#prevBtn').prop('disabled', false);
  $("#adminList").empty()
  lastStart = startAt
  let db = firebase.firestore()
    .collection(`users_log`)
    .orderBy('timestamp', 'desc')
    .startAfter(endAt)
    .limit(20)
  const first = db.get()
  .then(docs => {
    const all = docs.docs.length
    let allLogs = []
    const last = docs.docs.length - 1
    startAt.push(docs.docs[0])
    endAt = docs.docs[last];
    if (docs.docs.length < 20) {
      $('#nextBtn').prop('disabled', true);
    }
    docs.forEach(doc => {
      const log = doc.data()
      const { document, oldDocument, timestamp } = log
      const { uid, email } = oldDocument
      const diff = difference(document, oldDocument)
      const diffKeys = Object.keys(diff)
      let diffValues = []
      let walletChanged = false
      let walletChangeData = null
      diffKeys.forEach(diffKey => {
        const newData = document[diffKey]
        const oldData = oldDocument[diffKey]
        if (diffKey !== 'eth_wallet') {
          const injectData = {
            newData,
            oldData,
            field: diffKey
          }
          diffValues.push(injectData)
        } else {
          walletChanged = true
          walletChangeData = {
            newData,
            oldData,
            field: diffKey
          }
        }
      })
      allLogs.push({
        uid,
        email,
        diffValues,
        timeStamp: timestamp,
        walletChangeData,
        walletChanged
      })
    })
    // allLogs.sort((a, b) => b.timeStamp - a.timeStamp)
    for (let log of allLogs) {
      let elem = buildListUser(log)
      $("#adminList")[0].appendChild(elem)
    }
  })
}

function initializeDatabase(status) {
  let promise = new Promise(function(resolve, reject) {
    $("#adminList").empty()
    let db = firebase.firestore().collection(`users_log`).orderBy('timestamp', 'desc').limit(10)
    db.get()
    .then(docs => {
      const all = docs.docs.length
      let allLogs = []
      const last = docs.docs.length - 1
      firstDoc = docs.docs[0]
      endAt = docs.docs[last];
      startAt.push(docs.docs[0])
      docs.forEach(doc => {
        const log = doc.data()
        const { document, oldDocument, timestamp } = log
        const { uid, email } = oldDocument
        const diff = difference(document, oldDocument)
        const diffKeys = Object.keys(diff)
        let diffValues = []
        let walletChanged = false
        let walletChangeData = null
        diffKeys.forEach(diffKey => {
          const newData = document[diffKey]
          const oldData = oldDocument[diffKey]
          if (diffKey !== 'eth_wallet') {
            const injectData = {
              newData,
              oldData,
              field: diffKey
            }
            diffValues.push(injectData)
          } else {
            walletChanged = true
            walletChangeData = {
              newData,
              oldData,
              field: diffKey
            }
          }
        })
        allLogs.push({
          uid,
          email,
          diffValues,
          timeStamp: timestamp,
          walletChangeData,
          walletChanged
        })
      })
      // allLogs.sort((a, b) => b.timeStamp - a.timeStamp)
      for (let log of allLogs) {
        let elem = buildListUser(log)
        $("#adminList")[0].appendChild(elem)
      }
      resolve();
    })
  });
  return promise;
}

$(document).ready(function() {
  // Search list
  $("body").on("click", ".search i.fa-search", function() {
    $(this)
      .parents(".search")
      .addClass("show-search");
  });

  $("body").on("click", ".search i.fa-times", function() {
    $(this)
      .parents(".search")
      .removeClass("show-search");
  });

  // Listening to auth state change
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
      window.location.href = "/";
    } else {
      initializeAdmin()
        .then(() => {
          $("#adminShortcut").css("display", "block");
        })
        .catch(() => {
          window.location.href = "/wizard";
        })
        .finally(() => {
          initializeDatabase('all').then(() => {
            $("#preLoader").fadeToggle();
          });
        });
    }
  });
});
