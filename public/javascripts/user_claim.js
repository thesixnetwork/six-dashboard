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
function buildOption(doc) {
const option = document.createElement('OPTION')
option.setAttribute('value', doc)
option.setAttribute('label', doc)
return option
}

function buildListUser(data) {
const {
amount,
type,
userId,
valid_after,
claimed,
email
} = data

// build row
var tr = document.createElement("tr");
// userId
let td0 = document.createElement('td');
let txt0 = document.createTextNode(email)
td0.appendChild(txt0);

// userId
let td1 = document.createElement('td');
// let txt1 = document.createTextNode(`<a href='/user-dashboard.html?uid=${userId}'>${userId}</a>`)
td1.appendChild(txt1);

// amount column
var td2 = document.createElement("td");
var txt2 = document.createTextNode(amount);
td2.appendChild(txt2);

// type column
var td3 = document.createElement("td");
var txt3 = document.createTextNode(type);
td3.appendChild(txt3);

// valid_after column
var td4 = document.createElement("td");
var txt4 = document.createTextNode(moment(valid_after).format('DD/MM/YYYY'));
td4.appendChild(txt4);

// Allow trust column
var td5 = document.createElement("td");
var txt5 = document.createTextNode(claimed && claimed === true ? 'TRUE' : 'FALSE');
td5.style.color = claimed && claimed === true ? 'green' : 'red'
td5.appendChild(txt5);

// // trustline column
// var td6 = document.createElement("td");
// var txt6 = document.createTextNode(trustline);
// td6.appendChild(txt6);

tr.appendChild(td0);
tr.appendChild(td1);
tr.appendChild(td2);
tr.appendChild(td3);
tr.appendChild(td4);
tr.appendChild(td5);
// tr.appendChild(td6)
return tr
}

// Open user detail
function openUser(uid) {
$("#adminListMain").css("display", "none");
$("#detailFirstName").html(userData[uid].first_name || '-');
$("#detailLastName").html(userData[uid].last_name || '-');
$("#detailEmail").html(userData[uid].email || '-');
$("#detailPhoneNumber").html(userData[uid].phone_number || '-');
$("#detailCountry").html(countries[userData[uid].country] || '-');
if (userData[uid].country === "TH") {
$("#citizenIdContainer").css('display', 'block')
$("#citizenIdPhotoContainer").css('display', 'block')
$("#citizenIdPhotoBackContainer").css('display', 'block')
$("#detailCitizenId").html(userData[uid].citizen_id || '-')
$("#passportNumber").css("display", "none")
$("#passportPhoto").css("display", "none")
} else {
$("#citizenIdContainer").css('display', 'none')
$("#citizenIdPhotoContainer").css('display', 'none')
$("#citizenIdPhotoBackContainer").css('display', 'none')
$("#passportNumber").css("display", "block")
$("#passportPhoto").css("display", "block")
$("#detailPassportNumber").html(userData[uid].passport_number || '-')
}
$('#detailAddress').html(userData[uid].address || '-')
$('#detailPic1').attr("src", userData[uid].pic1)
$('#detailPic2').attr("src", userData[uid].pic2)
$('#detailPic3').attr("src", userData[uid].pic3)
$('#detailPic4').attr("src", userData[uid].pic4)
$('#detailPic5').attr("src", userData[uid].pic5)
let estimate = userData[uid].estimate
if (userData[uid].estimate_currency == "XLM") {
estimate = estimate*2050
}
let estimate_text = ""
if (estimate === undefined) {
estimate_text = "-"
} else {
estimate_text = estimate+" "+(userData[uid].estimate_currency || "ETH")
}
$('#detailEstimate').html(estimate_text)
$('#adminDetail').css('display', 'block')
if (userData[uid].kyc_status === 'pending') {
$("#rejctBox").css("display", "block")
$("#approveBox").css("display", "block")
} else {
$("#rejctBox").css("display", "none")
$("#approveBox").css("display", "none")
}
currentFocus = uid;
const user = firebase.auth().currentUser;
fetch("https://freegeoip.net/json/")
.then(res => res.json())
.then(data => data.ip)
.then(ip => {
if (currentFocus === uid) {
currentIp = ip;
firebase
.database()
.ref(`watch-list/${uid}`)
.set({
time: Date.now(),
ip,
uid: user.uid,
email: user.email
});
}
});
}

// go Back from detail
function goBack() {
$('#adminListMain').css('display', 'block')
$('#adminDetail').css('display', 'none')
$('#detailPic1').attr("src", '')
$('#detailPic2').attr("src", '')
$('#detailPic3').attr("src", '')
$('#detailPic4').attr("src", '')
$('#detailPic5').attr("src", '')
$("#detailFirstName").html("-");
$("#detailLastName").html("-");
$("#detailEmail").html("-");
$("#detailPhoneNumber").html("-");
$("#detailCountry").html("-");
$('#detailEstimate').html("-")
$('#detailAddress').html("-")
$('#detailCitizenId').html("-")
$("#detailPassportNumber").html('-')
removeWatching();
currentFocus = "";
}

function lockAll() {
let btn = document.getElementById("approveBtn");
let btn2 = document.getElementById("rejectBtn");
let rejecttype = document.getElementById("rejectSelect");
let rejectnote = document.getElementById("rejectNote");
btn.disabled = true;
btn2.disabled = true;
rejecttype.disabled = true;
rejectnote.disabled = true;
}

function unlockAll() {
let btn = document.getElementById("approveBtn");
let btn2 = document.getElementById("rejectBtn");
let rejecttype = document.getElementById("rejectSelect");
let rejectnote = document.getElementById("rejectNote");
btn.disabled = false;
btn2.disabled = false;
rejecttype.disabled = false;
rejectnote.disabled = false;
}

function approve() {
let thisFocus = currentFocus;
const user = firebase.auth().currentUser
lockAll();
let db = firebase.firestore();
db
.collection("users")
.doc(thisFocus)
.update({
kyc_status: "approved",
updater: user.uid,
updater_ip: currentIp,
update_time: Date.now()
})
.then(() => {
// $("#" + thisFocus).remove();
// unlockAll();
// return goBack();
location.reload();
})
.catch(err => {
alert(err.message);
unlockAll();
return
});
}

function rejectUser() {
let thisFocus = currentFocus;
lockAll();
let db = firebase.firestore();
const user = firebase.auth().currentUser
let rejecttype = document.getElementById("rejectSelect").value;
let rejectnote = document.getElementById("rejectNote").value;
let updateData = {
kyc_status: 'rejected',
reject_type: rejecttype,
updater: user.uid,
updater_ip: currentIp,
update_time: Date.now()
}
updateData.reject_note = rejectNote[rejecttype]
if (rejectnote !== undefined) {
updateData.reject_note_extend = rejectnote
}
if (rejecttype == "restricted") {
updateData.is_restricted = true
}
db
.collection("users")
.doc(thisFocus)
.update(updateData)
.then(() => {
// $("#" + thisFocus).remove();
// unlockAll();
// return goBack();
location.reload();
})
.catch(err => {
alert(err.message);
unlockAll();
return
});
}

function updateWatcherText (id) {
firebase
.database()
.ref(`watch-list/${id}`)
.on("value", snapshot => {
const value = snapshot.val();
if (value && value !== null) {
const { uid, ip, email } = value;
const user = firebase.auth().currentUser;
$(`#${id} td:last`).text(`Watching by ${email}, ip: ${ip}`);
if (uid !== user.uid && ip !== currentIp) {
$("#hasWatchingText").text(`${uid} watching this user `);
}
} else {
let db = firebase.firestore();
let userRef = db.collection("users").doc(id)
userRef.get()
.then(data => data.data())
.then(data => {
const { kyc_status } = data
if (kyc_status === 'pending') {
$(`#${id} td:last`).text("Pending");
$("#hasWatchingText").text(``);
}
})
}
});
}

function renderRegistrationTime(id, data) {
const date_string = data.registration_time && data.registration_time !== null ? moment(new Date(parseInt(data.registration_time))).format('DD/MM/YYYY') : ''
const dom = document.getElementById(`remarkText_${id}`)
dom.textContent = date_string
}

function renderStatus (id, data) {
const { updater } = data
switch(data.kyc_status) {
case 'approved':
$(`#${id} td:last`).text(`Approved by ${updater ? updater : '-'}`);
break
case 'rejected':
$(`#${id} td:last`).text(`Rejected by ${updater ? updater : '-'}`);
break
case 'pending':
updateWatcherText(id)
break
default:
$(`#${id} td:last`).text(`Not completed KYC`);
break
}
}

let unsubscribe = null
let filteredUsers = []
let current_startDate = null
let current_endDate = null
let dataTable = null
let current_documents = []

// Initialize database to query data and draw to view
function initializeDatabase(status, country, startDate, endDate) {
return new Promise((resolve) => {
const db = firebase.firestore().collection('claim_tx_logs')
const subscribe = db.onSnapshot(snapshot => {
const { docs } = snapshot
$('#claim_list').empty()

const promises = docs.map(raw_doc => {
let struct = { email: '', transaction_id: '', status: '', amount: '', update_timestamp: ''}
let claim_data = raw_doc.data()
claim_data = Object.assign(struct, claim_data)

// if (claim_data.update_timestamp && claim_data.update_timestamp !== '') {
// claim_data.update_timestamp = `${moment(parseInt(claim_data.update_timestamp)).format('DD/MM/YYYY (HH:mm:ss)')}`
// }
const { uid } = claim_data
return firebase.firestore().collection('users').doc(uid).get().then(res => {
const data = res.data()
const { email } = data
return Object.assign(claim_data, { email })
})
})

let second_promises = []
let claim_tx_logs_data = []
let total_passed = 0
let total_not_passed = 0
let total_pending = 0

Promise.all(promises).then(snapshots => {
let t = []
console.log(snapshots, 'snapshots...');
snapshots.forEach(snapshot => {
const { claim_id, uid } = snapshot
claim_tx_logs_data.push(snapshot)
t.push(firebase.firestore().collection('users_claim').doc(uid).collection('claim_period').doc(claim_id).get())
})
return t
}).then(z => {
Promise.all(z).then(snapshots => {
let final_data = []
snapshots.forEach(snapshot => {
const data = snapshot.data()
const uid = snapshot.ref.parent.parent.id
const claim_id = snapshot.id
const target_data = claim_tx_logs_data.find(c => c.uid === uid && c.claim_id === claim_id)
final_data.push(Object.assign(target_data, data))
})
let documents = []
final_data.forEach(data => {
const { state, uid } = data
let status = ''
let amount = ''
if (state === 3) {
status = '<span style="color: red;">Not Passed</span>'
total_not_passed += 1
} else if (state === 2) {
status = '<span style="color: green;">Passed</span>'
total_passed += 1
} else if (!state) {
status = '<span>Pending</span>'
total_pending += 1
}
let transaction_id = ''
if (state === 2) {
const { transaction_id: raw_transaction_id } = data
transaction_id = `<a href="https://stellarchain.io/tx/${raw_transaction_id}" target="_blank">${raw_transaction_id}</a>`
}
if (data.amount) {
amount = data.amount.toLocaleString()
}
const userId = uid && uid !== null ? `<a href="/user-dashboard.html?uid=${uid}" target="_blank">${uid}</a>` : ''
documents.push(Object.assign(data, { status, userId, transaction_id, amount }))
})
current_documents = documents
// documents.sort((a, b) => a.update_timestamp - b.update_timestamp).then(() => {
//   console.log('sort success')
// })
// console.log(documents, 'documents...');

dataTable = $('#claim-table').DataTable({
columnDefs: [{
  "targets": 4,
  render: (data) => {
    if (data && data !== null && data !== '') {
      return moment(parseInt(data)).format('DD/MM/YYYY (HH:mm:ss)')
    } else {
      return ''
    }
  }
}],
retrieve: true,
order: [[ 4, 'desc' ]],
data: documents,
columns: [
{ data: 'email' },
{ data: 'userId' },
{ data: 'status' },
{ data: 'amount' },
{ data: 'update_timestamp'},
{ data: 'transaction_id' }
]
});
document.getElementById('total_passed').innerHTML = total_passed
document.getElementById('total_not_passed').innerHTML = total_not_passed
})
})

// Promise.all(promises).then(snapshots => {
// let documents = []
// snapshots.forEach(snapshot => {
// const { state, uid } = snapshot
// let status = ''
// if (state === 3) {
// status = '<span style="color: red;">Not Passed</span>'
// total_not_passed += 1
// } else if (state === 2) {
// status = '<span style="color: green;">Passed</span>'
// total_passed += 1
// }
// let transaction_id = ''
// if (state === 2) {
// const { transaction_id: raw_transaction_id } = snapshot
// transaction_id = `<a href="http://testnet.stellarchain.io/tx/${raw_transaction_id}" target="_blank">${raw_transaction_id}</a>`
// }
// const userId = uid && uid !== null ? `<a href="/user-dashboard.html?uid=${uid}" target="_blank">${uid}</a>` : ''
// documents.push(Object.assign(snapshot, { status, userId, transaction_id }))
// })

// documents.forEach(doc => {
// console.log(doc, 'doc...')
// })

// current_documents = documents

// dataTable = $('#claim-table').DataTable({
// data: documents,
// columns: [
// { data: 'email' },
// { data: 'userId' || '' },
// { data: 'status' },
// { data: 'transaction_id' }
// ]
// });
// document.getElementById('total_passed').innerHTML = total_passed
// document.getElementById('total_not_passed').innerHTML = total_not_passed
// // Promise.all(internal_promises).then(dd => {

// // // dd.forEach(s => {
// // // console.log(s, 's...')
// // // const { amount, userId, type, valid_after, claimed, email } = s
// // // const elm = buildListUser({ amount, userId, type, valid_after, claimed, email })
// // // $('#claim_list')[0].appendChild(elm)
// // // })
// // })
// })

resolve()
})
})
}

function removeWatching(uid) {
firebase
.database()
.ref(`watch-list/${uid}`)
.remove();
}

let currentCountry = 'ALL'

function filterCountry (country) {
currentCountry = country
initializeDatabase(currentStatus, country, current_startDate, current_endDate)
}

function handleFilter (type) {
$(`#${currentStatus}`).removeClass('is-active')
$(`#${type}`).addClass('is-active')
currentStatus = type
initializeDatabase(type, null)
$('input[name="daterange"]').val('')
switch(type) {
case 'all':
$('#remarkColumn').show()
$('#remarkColumn').text('Registration Date')
$('#kycColumn').text("KYC Submit Datetime")
$('#contributeColumn').text("Estimate Contribute (ETH)")
$('#remindStatus').hide()
break
case 'approved':
$('#remarkColumn').show()
$('#remarkColumn').text('Approved By')
$('#kycColumn').text("KYC Submit Datetime")
$('#contributeColumn').text("Contributed")
$('#remindStatus').hide()
break
case 'rejected':
$('#remarkColumn').show()
$('#remarkColumn').text('Rejected By')
$('#kycColumn').text("KYC Submit Datetime")
$('#contributeColumn').text("Estimate Contribute (ETH)")
$('#remindStatus').hide()
break
case 'pending':
$('#remarkColumn').show()
$('#remarkColumn').text('Watcher')
$('#kycColumn').text("KYC Submit Datetime")
$('#contributeColumn').text("Estimate Contribute (ETH)")
$('#remindStatus').hide()
break
case 'notComplete':
$('#remarkColumn').hide()
$('#remindStatus').show()
$('#kycColumn').text("KYC Submit Datetime")
$('#remindStatus').text('REMIND STATUS')
$('#contributeColumn').text("Estimate Contribute (ETH)")
break
}
}

function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {
//If JSONData is not an object then JSON.parse will parse the JSON string in an Object
var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
var CSV = '';
//Set Report title in first row or line
CSV += ReportTitle + '\r\n\n';
gas = arrData
let allKeys = []
for (var i = 0; i < arrData.length; i++) {
let keys = Object.keys(arrData[i])
for (var j = 0; j < keys.length; j++) {
if (allKeys.indexOf(keys[j]) == -1 && keys[j] != 'pic1' && keys[j] != 'pic2' && keys[j] != 'pic3' && keys[j] != 'pic4' && keys[j] != 'pic5' && keys[j] != 'reject_note' && keys[j] != 'reject_note_extend' && keys[j] != 'updater' && keys[j] != 'updater_ip' && keys[j] != 'update_time' && keys[j] != 'seen_congrat' && keys[j] != 'first_transaction' && keys[j] != 'alloc_time' && keys[j] != 'alloc_transaction' && keys[j] != 'alloc_transaction_amount' && keys[j] != 'alloc_transaction_six_amount' && keys[j] != 'alloc_transaction_type' && keys[j] != 'reject_type' && keys[j] != 'memo' && keys[j] != 'user_number') {
allKeys.push(keys[j])
}
}
}
//This condition will generate the Label/Header
if (ShowLabel) {
var row = "";
//This loop will extract the label from 1st index of on array
for (var j = 0; j < allKeys.length; j++) {
let index = allKeys[j]
//Now convert each value to string and comma-seprated
row += index + ',';
}

row = row.slice(0, -1);
//append Label row with line break
CSV += row + '\r\n';
}
//1st loop is to extract each row
for (var i = 0; i < arrData.length; i++) {
var row = "";
//2nd loop will extract each column and convert it in string comma-seprated
for (var j = 0; j < allKeys.length; j++) {
let index = allKeys[j]
if (index == 'registration_time') {
let date = new Date(arrData[i][index] || 0)
var hours = date !== '' ? '0' + date.getHours() : '';
var minutes = date !== '' ? '0' + date.getMinutes() : '';
var seconds = date !== '' ? '0' + date.getSeconds() : '';
formattedTime = hours.substr(-2) + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);
formatted_date = date.toISOString().substr(0, 10)
row += '"' + String(formatted_date+" "+formattedTime || '-').replace(",", " ").replace("\n", " ") + '",';
} else {
row += '"' + String(arrData[i][index] || '-').replace(",", " ").replace("\n", " ") + '",';
}
}

row.slice(0, row.length - 1);
//add a line break after each row
CSV += row + '\r\n';
}

if (CSV == '') {
alert("Invalid data");
return;
}
//Generate a file name
var fileName = "";
//this will remove the blank-spaces from the title and replace it with an underscore
fileName += ReportTitle.replace(/ /g,"_");
//Initialize file format you want csv or xls
var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
// Now the little tricky part.
// you can use either>> window.open(uri);
// but this will not work in some browsers
// or you will not get the correct file extension
//this trick will generate a temp <a /> tag
var link = document.createElement("a");
link.href = uri;
//set the visibility hidden so it will not effect on your web-layout
link.style = "visibility:hidden";
link.download = fileName + ".csv";
//this part will append the anchor tag and remove it after automatic click
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}

function exportCSV () {
JSONToCSVConvertor(filteredUsers, "User Report", true)
}

$(document).ready(function() {
document.getElementById('version').innerHTML = `version 1.1.1`
$('#filter-status').change(e => {
if (e.target.value !== '') {
const target_status = parseInt(e.target.value)
dataTable.clear().draw()
const new_data = []
const passed = []
let not_passed = []
current_documents.forEach(doc => {
if (doc.state === target_status) {
new_data.push(doc)
}
})
dataTable.rows.add(new_data).draw()
} else if (e.target.value === 'pending') {
const target_status = parseInt(e.target.value)
dataTable.clear().draw()
const new_data = []
const passed = []
let not_passed = []
current_documents.forEach(doc => {
if (!doc.status) {
new_data.push(doc)
}
})
dataTable.rows.add(new_data).draw()
} else {
const target_status = parseInt(e.target.value)
dataTable.clear().draw()
dataTable.rows.add(current_documents).draw()
}
})

window.addEventListener("beforeunload", function(e) {
return removeWatching(currentFocus);
});

// Listening to auth state change
firebase.auth().onAuthStateChanged(function(user) {
if (!user) {
window.location.href = "/"+window.location.search
} else {
initializeAdmin()
.then(() => {
$("#adminShortcut").css("display", "block");
})
.catch(() => {
window.location.href = "/wizard"+window.location.search
})
.finally(() => {
initializeDatabase('all').then(() => {
$("#preLoader").fadeToggle();
});
});
}
});
});
