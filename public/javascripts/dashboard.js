// Log out function using in Wizardd page to sign current user out
function logOut () {
  firebase.auth().signOut()
}

// Set disbled to dom
function setDisable (doms) {
  doms.forEach(function (dom) {
    dom.disabled = true
  })
}

function compare(a,b) {
  if (a.data().time > b.data().time)
    return -1;
  if (a.data().time < b.data().time)
    return 1;
  return 0;
}

function compare_valid_after(a,b) {
  if (a.data().valid_after < b.data().valid_after)
    return -1;
  if (a.data().valid_after > b.data().valid_after)
    return 1;
  return 0;
}

function compare_type_order(a,b) {
  if (typeOrder[a] < typeOrder[b])
    return -1;
  if (typeOrder[a] > typeOrder[b])
    return 1;
  return 0;
}

// Remove disabled from dom
function setEnable (doms) {
  doms.forEach(function (dom) {
    dom.disabled = false
  })
}

let xlmPrice
let ethPrice
let userData

// Update User
function updateUser (data) {
  var updateUserOncall = firebase.functions().httpsCallable('updateUser')
  return updateUserOncall(data)
}

function submitConfirm() {
  let requestFunction = firebase.functions().httpsCallable('updateETHWallet')
  const ethAddressDOM = document.getElementById('walletETHinput')
  const btnDOM = document.getElementById('alertConfirmBtn')
  const canDOM = document.getElementById('cancelConfirmBtn')
  const ethAddress = ethAddressDOM.value.toLowerCase().trim()
  setDisable([btnDOM, canDOM])
  requestFunction({eth_address: ethAddress}).then(response => {
    if (response.data.success === true) {
      setEnable([btnDOM, canDOM])
      $("#mainBox").css("display", "none")
      $("#depositETHBox").css("display", "block")
      $("#walletBox").css("display", "none")
      $("#warnBox").css("display", "none")
      cancelConfirm()
    } else {
      $("#submitWalletAlertText").html(response.data.error_message)
      if ($("#submitWalletAlert").css("display") === 'none') {
        $("#submitWalletAlert").slideToggle()
      }
      setEnable([btnDOM, canDOM])
      cancelConfirm()
    }
  })
}

function cancelConfirm() {
  if ($("#alertModal").css("display") !== 'none') {
    $("#alertModal").fadeToggle()
  }
}

function startConfirmation() {
  if ($("#submitWalletAlert").css("display") === 'block') {
    $("#submitWalletAlert").slideToggle()
  }
  const ethAddressDOM = document.getElementById('walletETHinput')
  const confirmAddressBtnDOM = document.getElementById('confirmAddressBtn')
  const ethAddress = ethAddressDOM.value.toLowerCase().trim()
  if (ethAddress === undefined || ethAddress === null || ethAddress === '') {
    $("#ethWalletAddressAlert").addClass("invalid")
    $("#ethWalletAddressAlertText").html("ETH Address could not be blank")
    $("#ethWalletAddressAlertText").css("display", "block")
  } else if (/^0x[a-fA-F0-9]{40}$/.test(ethAddress) == false) {
    $("#ethWalletAddressAlert").addClass("invalid")
    $("#ethWalletAddressAlertText").html("ETH Address is invalid")
    $("#ethWalletAddressAlertText").css("display", "block")
  } else {
    let requestFunction = firebase.functions().httpsCallable('updateETHWallet')
    setDisable([ethAddressDOM, confirmAddressBtnDOM])
    requestFunction({eth_address: ethAddress}).then(response => {
      if (response.data.success === true) {
        setEnable([ethAddressDOM, confirmAddressBtnDOM])
        $("#mainBox").css("display", "none")
        $("#depositETHBox").css("display", "block")
        $("#walletBox").css("display", "none")
        $("#warnBox").css("display", "none")
        $("#myWallet").css("display", "block")
        $("#myETHaddress")[0].value = ethAddress
        $("#myETHWalletAddress").html(ethAddress)
        $("#myETHWalletAddress").attr('data-clipboard-text', userData.ethAddress)
        $("#myAddressBtn").attr('data-clipboard-text', userData.ethAddress)
        userData.submit_wallet = true
      } else {
        $("#submitWalletAlertText").html(response.data.error_message)
        if ($("#submitWalletAlert").css("display") === 'none') {
          $("#submitWalletAlert").slideToggle()
        }
        setEnable([ethAddressDOM, confirmAddressBtnDOM])
      }
    })
  }
}

function checkWarning() {
  const warning1DOM = document.getElementById('warning1')
  const warning2DOM = document.getElementById('warning2')
  const warning3DOM = document.getElementById('warning3')
  if (warning1DOM.checked && warning2DOM.checked && warning3DOM.checked) {
    const btnDOM = document.getElementById('acknowledgeBtn')
    setEnable([btnDOM])
  } else {
    const btnDOM = document.getElementById('acknowledgeBtn')
    setDisable([btnDOM])
  }
}

function submitAcknowledge() {
  const warning1DOM = document.getElementById('warning1')
  const warning2DOM = document.getElementById('warning2')
  const warning3DOM = document.getElementById('warning3')
  const btnDOM = document.getElementById('acknowledgeBtn')
  setDisable([warning1DOM, warning2DOM, warning3DOM, btnDOM])
  $("#walletBox").css("display", "block")
  $("#acknowledgeBtn").css("display", "none")
}

function saveETHwallet() {
  const currentUser = firebase.auth().currentUser
  const ethWalletBtnDOM = document.getElementById('ethWalletBtn')
  const ethWalletDOM = document.getElementById('walletETHinput')
  setDisable([ethWalletDOM, ethWalletBtnDOM])

}

function latestXLMprice() {
  const time = new Date()
  let timeZero = time.setMinutes(0, 0, 0)

  return firebase.firestore()
    .collection('xlm_prices')
    .doc(timeZero.toString())
    .get()
    .then(snapshot => snapshot.data())
    .then((price) => {
      if (!price.price) {
        timeZero = time.setHours(time.getHours() - 1, 0, 0, 0)
        fireStore
          .collection('xlm_prices')
          .doc(timeZero.toString())
          .get()
          .then(snapshot => snapshot.data())
          .then((price) => {
            return {
              timeZero,
              price
            }
          })
      }

      return {
        timeZero,
        price
      }
    })
}

function latestETHprice() {
  const time = new Date()
  let timeZero = time.setMinutes(0, 0, 0)

  return firebase.firestore()
    .collection('eth_prices')
    .doc(timeZero.toString())
    .get()
    .then(snapshot => snapshot.data())
    .then((price) => {
      if (!price.price) {
        timeZero = time.setHours(time.getHours() - 1, 0, 0, 0)
        fireStore
          .collection('eth_prices')
          .doc(timeZero.toString())
          .get()
          .then(snapshot => snapshot.data())
          .then((price) => {
            return {
              timeZero,
              price
            }
          })
      }

      return {
        timeZero,
        price
      }
    })
}

function updateXLMprice() {
  latestXLMprice().then(data => {
    $(".xlmPrice").html("1 XLM = "+data.price.price+" USD")
    xlmPrice = data.price
    const elem = document.getElementById('xlmToSixInput')
    setEnable([elem])
  })
}

function updateETHprice() {
  latestETHprice().then(data => {
    $(".ethPrice").html("1 ETH = "+data.price.price+" USD")
    ethPrice = data.price
    const elem = document.getElementById('ethToSixInput')
    setEnable([elem])
  })
}

function updatePrice() {
  updateXLMprice()
  updateETHprice()
}

// Chack if admin or not
function initializeAdmin () {
  let promise = new Promise(function (resolve, reject) {
    let db = firebase.firestore()
    db.collection('admins').get()
      .then(() => {
        resolve()
      })
      .catch(() => {
        reject()
      })
  })
  return promise
}

function submitWay() {
  const waySelectDOM = document.getElementById('waySelect')
  const way = waySelectDOM.value
  if (way === 'xlm') {
    $("#questionBox").css("display", "none")
    $("#depositETHBox").css("display", "none")
    $("#depositXLMBox").css("display", "block")
    $("#xlmToSixInput")[0].value = ""
    $("#mainBox").css("display", "none")
    $("#walletBox").css("display", "none")
    $("#warnBox").css("display", "none")
  } else {
    if (userData.submit_wallet !== true) {
      $("#questionBox").css("display", "none")
      $("#depositETHBox").css("display", "none")
      $("#depositXLMBox").css("display", "none")
      $("#mainBox").css("display", "none")
      $("#walletBox").css("display", "none")
      $("#warnBox").css("display", "block")
    } else {
      $("#questionBox").css("display", "none")
      $("#depositETHBox").css("display", "block")
      $("#depositXLMBox").css("display", "none")
      $("#mainBox").css("display", "none")
      $("#walletBox").css("display", "none")
      $("#warnBox").css("display", "none")
    }
    $("#ethToSixInput")[0].value = ""
  }
}

function submitWelcome() {
  $("#welcomeBox").css("display", "none")
  $("#questionBox").css("display", "block")
  $("#mainBox").css("display", "none")
  $("#walletBox").css("display", "none")
  $("#warnBox").css("display", "none")
}

function submitDepositXLM() {
  const xlmToSixInput = document.getElementById("xlmToSixInput")
  const xlm_value = (parseFloat(xlmToSixInput.value) || 0)
  if (xlm_value > 0 && xlmToSixInput.value !== undefined && xlmToSixInput.value !== null && xlmToSixInput.value !== '') {
    $("#depositXLMamount").html(xlm_value)
    $("#depositXLMBox").css("display", "none")
    $("#submitXLMBox").css("display", "block")
  } else {
    $("#xlmToSixInputAlert").addClass("invalid")
    $("#xlmToSixInputAlertText").html("Value should be > 0")
    $("#xlmToSixInputAlertText").css("display", "block")
  }
}

function submitDepositETH() {
  const ethToSixInput = document.getElementById("ethToSixInput")
  const eth_value = (parseFloat(ethToSixInput.value) || 0)
  if (eth_value > 0 && ethToSixInput.value !== undefined && ethToSixInput.value !== null && ethToSixInput.value !== '') {
    $("#depositETHamount").html(eth_value)
    $("#depositETHBox").css("display", "none")
    $("#submitETHBox").css("display", "block")
  } else {
    $("#ethToSixInputAlert").addClass("invalid")
    $("#ethToSixInputAlertText").html("Value should be > 0")
    $("#ethToSixInputAlertText").css("display", "block")
  }
}

let globalCurrent
let percentageGlobalCurrent
function getCurrentTotal() {
  return firebase.firestore().collection('total_asset').doc('six').get().then(doc => {
    const totalAsset = parseFloat(doc.data().total || 0)
    const privateAsset = parseFloat(doc.data().private || 0)
    const currentAsset = privateAsset+totalAsset
    const softCapAmount = doc.data().soft_cap
    const percentage = Number(((currentAsset/(doc.data().hard_cap/100)) || 0).toFixed(0))
    let scalePercentage = Number((((((100-percentage)*99273.68461538461)+currentAsset)/(doc.data().hard_cap/100)) || 0).toFixed(1))
    percentageGlobalCurrent = Number(scalePercentage)
    globalCurrent = Number(parseFloat(currentAsset/1000000).toFixed(1))
  })
}

function runGlobalNumber() {
  var decimal_places = 1;
  $('#totalCurrentAsset').animateNumber(
    {
      number: globalCurrent,
      numberStep: function(now, tween) {
        var target = $(tween.elem);
        floored_number = now.toFixed(decimal_places);
        target.text(floored_number+'M SIX');
      }
    }
  )
  $("#barPercentage").css("width", Number(percentageGlobalCurrent)+"%")
}

function submitDepositXLMTran() {
  const btnDOM = document.getElementById("submitDepositXLMTran")
  const xlmToSixInput = document.getElementById("xlmToSixInput")
  const xlm_value = (parseFloat(xlmToSixInput.value) || 0)
  setDisable([btnDOM])
  let amount = 0
  amount = Number((xlm_value*xlmPrice.six_per_xlm).toFixed(7))
  window.dataLayer = window.dataLayer || [];
  function gtag () {
    dataLayer.push(arguments);
  }
  gtag('event','click',{'event_category':'button','event_label':'add_deposit'});
  updateUser({first_transaction: true, alloc_transaction: true, alloc_transaction_type: 'XLM', alloc_transaction_amount: xlm_value, alloc_transaction_six_amount: amount, alloc_time: (new Date()).getTime()}).then(() => {
    setEnable([btnDOM])
    $("#questionBox").css("display", "none")
    $("#submitXLMBox").css("display", "none")
    $("#submitETHBox").css("display", "none")
    $("#depositETHBox").css("display", "none")
    $("#depositXLMBox").css("display", "none")
    $("#mainBox").css("display", "none")
    const thisTime = (new Date()).getTime()
    const elem = buildListTx({ time: thisTime, native_amount: xlm_value, type: "XLM", to: '-', id: '-', time: thisTime, six_amount: amount.toLocaleString(), tx_status: 'pending' })
    $("#userTxs")[0].prepend(elem)
    if (userData.seen_congrat === true) {
      $("#mainBox").css("display", "block")
    } else {
      $("#congratulationBox").css("display", "block")
    }
    $("#walletBox").css("display", "none")
    $("#warnBox").css("display", "none")
  })
}

function submitDepositETHTran() {
  const btnDOM = document.getElementById("submitDepositETHTran")
  const ethToSixInput = document.getElementById("ethToSixInput")
  const eth_value = (parseFloat(ethToSixInput.value) || 0)
  setDisable([btnDOM])
  let amount = 0
  amount = Number((eth_value*ethPrice.six_per_eth).toFixed(7))
  window.dataLayer = window.dataLayer || [];
  function gtag () {
    dataLayer.push(arguments);
  }
  gtag('event','click',{'event_category':'button','event_label':'add_deposit'});

  updateUser({first_transaction: true, alloc_transaction: true, alloc_transaction_type: 'ETH', alloc_transaction_amount: eth_value, alloc_transaction_six_amount: amount, alloc_time: (new Date()).getTime()}).then(() => {
    setEnable([btnDOM])
    $("#questionBox").css("display", "none")
    $("#submitXLMBox").css("display", "none")
    $("#submitETHBox").css("display", "none")
    $("#depositETHBox").css("display", "none")
    $("#depositXLMBox").css("display", "none")
    $("#mainBox").css("display", "none")
    const thisTime = (new Date()).getTime()
    const elem = buildListTx({ time: thisTime, native_amount: eth_value, type: "ETH", to: '-', id: '-', time: thisTime, six_amount: amount.toLocaleString(), tx_status: 'pending' })
    $("#userTxs")[0].prepend(elem)
    if (userData.seen_congrat === true) {
      $("#mainBox").css("display", "block")
    } else {
      $("#congratulationBox").css("display", "block")
    }
    $("#walletBox").css("display", "none")
    $("#warnBox").css("display", "none")
  })
}

function submitCongrat() {
  updateUser({seen_congrat: true})
  userData.seen_congrat = true
  $("#questionBox").css("display", "none")
  $("#submitXLMBox").css("display", "none")
  $("#submitETHBox").css("display", "none")
  $("#depositETHBox").css("display", "none")
  $("#depositXLMBox").css("display", "none")
  $("#mainBox").css("display", "block")
  $("#congratulationBox").css("display", "none")
  $("#walletBox").css("display", "none")
  $("#warnBox").css("display", "none")
}

function backToDashboard() {
  $("#questionBox").css("display", "none")
  $("#submitXLMBox").css("display", "none")
  $("#submitETHBox").css("display", "none")
  $("#depositETHBox").css("display", "none")
  $("#depositXLMBox").css("display", "none")
  $("#mainBox").css("display", "block")
  $("#congratulationBox").css("display", "none")
  $("#walletBox").css("display", "none")
  $("#warnBox").css("display", "none")
}

function gotoCurrency() {
  $("#questionBox").css("display", "block")
  $("#submitXLMBox").css("display", "none")
  $("#submitETHBox").css("display", "none")
  $("#depositETHBox").css("display", "none")
  $("#depositXLMBox").css("display", "none")
  $("#mainBox").css("display", "none")
  $("#congratulationBox").css("display", "none")
  $("#walletBox").css("display", "none")
  $("#warnBox").css("display", "none")
}

function buildFreeTx() {
  var tr = document.createElement("tr");
  var td1 = document.createElement("td");
  var txt1 = document.createTextNode('-')
  td1.appendChild(txt1);

  var td2 = document.createElement("td");
  var txt2 = document.createTextNode("20 SIX");
  td2.appendChild(txt2);

  var td3 = document.createElement("td");
  var txt3 = document.createTextNode("-");
  td3.appendChild(txt3)

  var td4 = document.createElement("td");
  var txt4 = document.createTextNode("airdrop");
  td4.appendChild(txt4)

  var td5 = document.createElement("td");
  var txt5 = document.createTextNode("-");
  td5.appendChild(txt5)

  tr.appendChild(td1);
  tr.appendChild(td2);
  tr.appendChild(td3);
  tr.appendChild(td4);
  tr.appendChild(td5);

  return tr
}

function buildListTx(doc) {
  const { time: t, native_amount, type: currency_type, to, id, time, six_amount, tx_status } = doc
  let date = new Date(parseFloat(t));

  var tr = document.createElement("tr");
  var td1 = document.createElement("td");
  var txt1 = document.createTextNode(native_amount + " " +currency_type.toUpperCase())
  td1.appendChild(txt1);
  // email
  var td2 = document.createElement("td");
  var txt2 = document.createTextNode(six_amount + " SIX");
  td2.appendChild(txt2);
  // edt fiele
  var td3 = document.createElement("td");
  var txt3 = document.createTextNode(id.split("_")[0]);
  td3.appendChild(txt3)

  let this_status = 'success'
  if (tx_status === 'pending') {
    this_status = 'pending'
  }
  // edt fiele
  var td4 = document.createElement("td");
  var txt4 = document.createTextNode(this_status);
  td4.appendChild(txt4)

  var td5 = document.createElement("td");
  var txt5 = document.createTextNode(moment(date).format('DD-MM-YYYY') +" "+moment(date).format('HH:mm'));
  td5.appendChild(txt5);
  tr.appendChild(td1);
  tr.appendChild(td2);
  tr.appendChild(td3);
  tr.appendChild(td4);
  tr.appendChild(td5);
  return tr
}

allClaimTable = {}
var allPrivateContract = 1

function buildTableType(type) {
  if ((privateType[type] || {}).table === undefined) {
    type = type
  } else {
    type = privateType[type].table
  }
  if (allClaimTable[type] === undefined) {
    var overallDiv = document.createElement("div")
    var div = document.createElement("div")
    div.id = 'table-container-'+type
    var typeTable
    if ((privateType[type] || {}).type === 'private') {
      typeTable = 'privateTable'
    } else {
      typeTable = 'publicTable'
    }
    div.className = "claimTableContainer "+typeTable
    var table = document.createElement("table")
    table.className = "claimTable"
    var thead = document.createElement("thead")
    var tr = document.createElement("tr")
    var th1 = document.createElement("th")
    var txt1
    if ((privateType[type] || {}).type == 'private') {
      txt1 = document.createTextNode("Unlock Date")
    } else {
      txt1 = document.createTextNode("Available Date")
    }
    $(th1).attr("width", "150")
    var th2 = document.createElement("th")
    var txt2 = document.createTextNode("Amount")
    $(th2).attr("width", "180")
    var th3 = document.createElement("th")
    var txt3 = document.createTextNode("Bonus")
    $(th3).attr("width", "180")
    var th4 = document.createElement("th")
    var txt4 = document.createTextNode("Transaction ID")
    $(th4).attr("width", "400")
    var th5 = document.createElement("th")
    var txt5 = document.createTextNode("Status")
    $(th5).attr("width", "200")
    var tbody = document.createElement("tbody")
    tbody.className = "claimTxs"
    tbody.id = 'table-'+type

    th1.appendChild(txt1)
    th2.appendChild(txt2)
    th3.appendChild(txt3)
    th4.appendChild(txt4)
    th5.appendChild(txt5)
    tr.appendChild(th1)
    tr.appendChild(th2)
    tr.appendChild(th3)
    tr.appendChild(th4)
    tr.appendChild(th5)
    thead.appendChild(tr)
    table.appendChild(thead)
    table.appendChild(tbody)
    div.appendChild(table)
    if ((privateType[type] || {}).type === 'private') {
      var pDom = document.createElement("p")
      var txt7 = document.createTextNode("Contract Type "+allPrivateContract)
      pDom.className = 'tableContractName privateTable'
      pDom.appendChild(txt7)
      overallDiv.appendChild(pDom)
      allPrivateContract = allPrivateContract + 1
    }
    overallDiv.appendChild(div)

    allClaimTable[type] = true
    return overallDiv
  } else {
    return undefined
  }
}

function getFlooredFixed(v, d) {
  return (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
}

function numberWithCommas(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function buildListClaim(doc, id) {
  const { amount, claimed, valid_after, transaction_id, type, state, bonus } = doc
  var tr = document.createElement("tr")
  $(tr).attr("total-amount", amount)
  var td1 = document.createElement("td");
  var txt1 = document.createTextNode(formatDate(valid_after))
  td1.appendChild(txt1)

  var td2 = document.createElement("td");
  var txt2
  var td3 = document.createElement("td");
  var txt3
  if (privateBonus[type] !== undefined || (bonus !== undefined && bonus !== null)) {
    let bonusPercent = privateBonus[type] || bonus
    let rawAmount = (amount*100)/(100+bonusPercent)
    var txt2 = document.createTextNode(numberWithCommas(parseFloat(getFlooredFixed(rawAmount, 7))).toString() + " SIX")
    var txt3 = document.createTextNode(numberWithCommas(parseFloat(getFlooredFixed((amount-rawAmount), 7))).toString() + " SIX")
  } else {
    txt2 = document.createTextNode(numberWithCommas(parseFloat(getFlooredFixed(amount, 7))).toString() + " SIX")
    txt3 = document.createTextNode('-')
  }
  td2.appendChild(txt2)
  td3.appendChild(txt3)

  var td4 = document.createElement("td");
  td4.className = "transactionId truncate"
  var a4 = document.createElement("a");
  a4.className = ""
  if (transaction_id === undefined) {
    a4.href = "#"
  } else {
    let stellarChainiUrl
    var domain = window.location.href
    if (domain.match('localhost')) {
      stellarChainUrl = 'http://testnet.stellarchain.io'
    } else if (domain.match('six-dashboard')) {
      stellarChainUrl = 'http://testnet.stellarchain.io'
    } else if (domain.match('ico.six.network') || domain.match('sixdashboard')) {
      stellarChainUrl = 'https://stellarchain.io'
    } else {
      stellarChainUrl = 'http://testnet.stellarchain.io'
    }
    a4.href = stellarChainUrl+"/tx/"+transaction_id
  }
  var txt4 = document.createTextNode(transaction_id || '-')
  a4.appendChild(txt4)
  td4.appendChild(a4)

  var td5 = document.createElement("td")
  var thisbtn = document.createElement("button")
  thisbtn.id = "claim-"+id
  if ((new Date) > valid_after) {
    if (claimed === true) {
      tr.className = 'claimListItem stillClaimed'
      thisbtn.className = "claimMoneyBtn claimed"
      var txt5 = document.createTextNode("Claimed")
      thisbtn.appendChild(txt5)
      thisbtn.disabled = true
    } else {
      if (state == 1) {
        tr.className = 'claimListItem stillAvail'
        thisbtn.className = "claimMoneyBtn processing"
        var txt5 = document.createTextNode("Processing")
        thisbtn.appendChild(txt5)
        thisbtn.disabled = true
      } else if (state == 3) {
        tr.className = 'claimListItem stillAvail'
        thisbtn.className = "claimMoneyBtn claimError"
        var txt5 = document.createTextNode("Pending")
        thisbtn.appendChild(txt5)
        thisbtn.disabled = true
      } else {
        tr.className = 'claimListItem stillAvail'
        thisbtn.className = "claimMoneyBtn avail"
        var txt5 = document.createTextNode("Claim")
        thisbtn.appendChild(txt5)
        thisbtn.onclick = function() { claimSix(id) }
      }
    }
  } else {
    tr.className = 'claimListItem stillNotAvail'
    thisbtn.className = "claimMoneyBtn notAvail"
    var txt5 = document.createTextNode("Not Available")
    thisbtn.appendChild(txt5)
    thisbtn.disabled = true
  }
  td5.className = "listBtnContainer"
  td5.appendChild(thisbtn)

  tr.appendChild(td1)
  tr.appendChild(td2)
  tr.appendChild(td3)
  tr.appendChild(td4)
  tr.appendChild(td5)

  tr.id = "list-claim-"+id
  return tr
}

const typeOrder = {
  'free': 0,
  'presale': 1,
  'ico': 2,
  'A': 3,
  'B': 4,
  'C': 5,
  'D': 6,
  'E': 7,
  'F': 8,
  'G': 9,
  'H': 10,
  'I': 11,
  'J': 12,
  'K': 13,
  'L': 14,
  'M': 15,
  'N': 16,
  'Type AV': 17,
  'Type BN': 18,
  'Type BN - 2': 19,
  'Type BN - THB': 20,
  'Type BT': 21,
  'Type FR': 22,
  'Type P0': 23,
  'Type P1': 24,
  'Type P1 - THB': 25,
  'Type P2': 26,
  'Type P2 - THB': 27,
  'Type PL': 28,
  'Type SS': 29,
  'Type RF': 30,
  'Type SP': 31
}

const privateBonus = {
  'presale': 6
}

const privateType = {
  'free': {
    name: 'Airdrop',
    description: 'An airdrop SIX Token for one who was submitted KYC before 25 June 2018.',
    type: 'public',
    table: 'public'
  },
  'presale': {
    name: 'Presale',
    description: '+6% is added for everyone who contributed SIX Token in the Pre-ICO period.',
    type: 'public',
    table: 'public'
  },
  'ico': {
    name: 'Public',
    description: 'General Token contract.',
    type: 'public',
    table: 'public'
  },
  'A': {
    name: 'Private Sale contract A',
    description: '15% Discount private sale contract.',
    type: 'private'
  },
  'B': {
    name: 'Private Sale contract B',
    description: '20% Discount private sale contract.',
    type: 'private'
  },
  'C': {
    name: 'Private Sale contract C',
    description: '40% Discount private sale contract.',
    type: 'private'
  },
  'D': {
    name: 'Private Sale contract D',
    description: '50% Discount private sale contract which seperated into three transactions; The first can be claimed after the ending of ICO. The second can be claimed on 30 days after the ending of ICO. The third can be claimed on 60 days after the ending of ICO.',
    type: 'private'
  },
  'E': {
    name: 'Private Sale contract E',
    description: '50% Bonus private sale contract.',
    type: 'private'
  },
  'F': {
    name: 'Private Sale contract F',
    description: '67% Discount private sale contract. Can be claimed on 1 years after the ending of ICO.',
    type: 'private'
  },
  'G': {
    name: 'Private Sale contract G',
    description: 'Founding Member contract.',
    type: 'private'
  },
  'H': {
    name: 'Private Sale contract H',
    description: 'Advisor contract.',
    type: 'private'
  },
  'I': {
    name: 'Private Sale contract I',
    description: 'Founder contract.',
    type: 'private'
  },
  'J': {
    name: 'Private Sale contract J',
    description: 'Bounty contract.',
    type: 'private'
  },
  'K': {
    name: 'Private Sale contract K',
    description: 'Pool token contract.',
    type: 'private'
  },
  'L': {
    name: 'Private Sale contract L',
    description: 'Crowd contract.',
    type: 'private'
  },
  'M': {
    name: 'Private Sale contract M',
    description: '20% Bonus private sale contract.',
    type: 'private'
  },
  'N': {
    name: 'Private Sale contract N',
    description: '35% Bonus private sale contract.',
    type: 'private'
  },
  'Type AV': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type BN': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type BN - 2': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type BN - THB': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type BT': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type FR': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type P0': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type P1': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type P1 - THB': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type P2': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type P2 - THB': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type PL': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type SS': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type RF': {
    name: 'Type AV',
    description: '',
    type: 'private'
  },
  'Type SP': {
    name: 'Type AV',
    description: '',
    type: 'private'
  }
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function uniqArray(arrArg) {
  return arrArg.filter(function(elem, pos,arr) {
    return arr.indexOf(elem) == pos;
  });
};

function getClaims() {
  if (firebase.auth().currentUser !== null) {
    let totalSix2 = 0
    firebase.firestore().collection('users_claim').doc(firebase.auth().currentUser.uid).collection('claim_period').get().then(docs => {
      let allData = []
      docs.forEach(function(doc) {
        allData.push(doc)
      })
      let allType = allData.map(function(doc) { return doc.data().type })
      let foundPrivate = false
      allType.forEach(function(thisType) {
        if (privateType[thisType].type === 'private') {
          foundPrivate = true
        }
      })
      let uniqType = uniqArray(allType)
      let targetDiv = document.getElementById("forClaimTable")
      uniqType.forEach(tableType => {
        let newTable = buildTableType(tableType)
        if (newTable !== undefined) {
          targetDiv.appendChild(newTable)
        }
      })
      if (foundPrivate === true) {
        $("#menuContainer").css("display", "flex")
      }
      $(".privateTable").css("display", "none")
      allData.sort(compare_valid_after)
      allData.forEach(d => {
        let data = d.data()
        const elem = buildListClaim(data, d.id)
        totalSix2 = totalSix2 + data.amount
        let targetTable
        if (privateType[data.type].table === undefined) {
          targetTable = data.type
        } else {
          targetTable = privateType[data.type].table
        }
        let thisTable = document.getElementById("table-"+targetTable)
        thisTable.appendChild(elem)
      })
      updateGraph()
    }).then(() => {
      var percent_number_step = $.animateNumber.numberStepFactories.append(' SIX')
      $('#totalSix').animateNumber(
        {
          number: totalSix2.toFixed(7),
          numberStep: percent_number_step
        }
      );
    }).then(() => {
      let query = firebase.firestore().collection('users_claim').doc(firebase.auth().currentUser.uid).collection('claim_period')
      query.onSnapshot(docs => {
        let moreAvailableClaim = []
        docs.forEach(doc => {
          let data = doc.data()
          let id = doc.id
          if (data.state === 1) {
            setDisable([$("#claim-"+id)[0]])
            $("#claim-"+id).text("Processing")
            $("#claim-"+id).addClass("processing").removeClass("avail").removeClass('claimError')
          } else if (data.state === 2 && data.claimed === true) {
            setDisable([$("#claim-"+id)[0]])
            $("#claim-"+id).text("Claimed")
            $("#claim-"+id).addClass("avail").removeClass("processing").removeClass('claimError')
            $("#claim-"+id).parent().parent().removeClass("stillAvail").addClass("stillClaimed")
            $("#list-claim-"+id+" .transactionId a").text(data.transaction_id)
            let stellarChainiUrl
            var domain = window.location.href
            if (domain.match('localhost')) {
              stellarChainUrl = 'http://testnet.stellarchain.io'
            } else if (domain.match('six-dashboard')) {
              stellarChainUrl = 'http://testnet.stellarchain.io'
            } else if (domain.match('ico.six.network') || domain.match('sixdashboard')) {
              stellarChainUrl = 'https://stellarchain.io'
            } else {
              stellarChainUrl = 'http://testnet.stellarchain.io'
            }
            $("#list-claim-"+id+" .transactionId a").attr('href', stellarChainUrl+"/tx/"+data.transaction_id)
            updateGraph()
          } else if (data.state === 3) {
            setDisable([$("#claim-"+id)[0]])
            $("#claim-"+id).text("Error")
            $("#claim-"+id).addClass("claimError").removeClass("avail").removeClass('processing')
            if (localStorage[userData.uid+"seen_error"] === undefined) {
              $(".dialog-claim-error").addClass("show-dialog")
              localStorage[userData.uid+"seen_error"] = true
            }
          }
          if (data.claimed !== true) {
            moreAvailableClaim.push(data)
          }
        })
        if (moreAvailableClaim.length === 0) {
          if (localStorage[userData.uid+"seen_whats_next"] === undefined) {
            $(".dialog-whats-next").addClass("show-dialog")
            localStorage[userData.uid+"seen_whats_next"] = true
          }
        }
      })
    })
  }
}

var walletInterval
function getMyWalletBalance() {
  $("#showXLMWalletBalanceSection").show()
  let stellarUrl
  var domain = window.location.href
  if (domain.match('localhost')) {
    stellarUrl = 'https://horizon-testnet.stellar.org'
    StellarSdk.Network.useTestNetwork()
  } else if (domain.match('six-dashboard')) {
    stellarUrl = 'https://horizon-testnet.stellar.org'
    StellarSdk.Network.useTestNetwork()
  } else if (domain.match('ico.six.network') || domain.match('sixdashboard')) {
    stellarUrl = 'https://horizon.stellar.org'
    StellarSdk.Network.usePublicNetwork()
  } else {
    stellarUrl = 'https://horizon-testnet.stellar.org'
    StellarSdk.Network.useTestNetwork()
  }
  const server = new StellarSdk.Server(stellarUrl)
  let accountCaller = server.accounts()
  accountCaller.accountId(userData.xlm_address)

  var percent_number_step = $.animateNumber.numberStepFactories.separator(",")
  accountCaller.call().then(account => {
    let sixAsset = account.balances.find(x => { return x.asset_code == 'SIX' })
    if (sixAsset !== undefined) {
      let thisAccBalance = parseFloat(sixAsset.balance)
      $('#myCurrentBalance').animateNumber(
        {
          number: thisAccBalance.toFixed(7),
          numberStep: percent_number_step
        }
      );
      if (walletInterval === undefined) {
        walletInterval = setInterval(() => { getMyWalletBalance() }, 10000)
        $("#myCurrentBalance2").text(" SIX")
      }
    } else {
      $('#myCurrentBalance').text("0")
      if (walletInterval === undefined) {
        walletInterval = setInterval(() => { getMyWalletBalance() }, 10000)
        $("#myCurrentBalance2").text(" SIX")
      }
    }
  }).catch(err => { console.log(err) })
}

let totalSix = 20

function getTxs () {
  if (firebase.auth().currentUser !== null) {
    if (userData.update_time !== undefined && userData.update_time > 1527692400000) {
      totalSix = 0
    }
    firebase.firestore().collection('purchase_txs')
    .where("user_id",'==',firebase.auth().currentUser.uid)
    .get()
    .then(snapshot => {
      return firebase.firestore().collection('presale').doc('supply').collection('purchased_presale_tx').doc(firebase.auth().currentUser.uid).get().then(preDoc => {
        let preDocData = preDoc.data()
        if (preDocData === undefined) {
          preDocData = {}
        }
        $('#userTxs').empty()
        $('#userTxs2').empty()
        let allDoc = []
        snapshot.forEach(d => {
          allDoc.push(d)
        })
        allDoc.sort(compare)
        allDoc.forEach(d => {
          let data = d.data()
          if (preDocData[d.id] !== undefined && preDocData[d.id] !== null) {
            data.six_amount = Number((data.six_amount * 1.06).toFixed(7))
            totalSix += data.six_amount
            //$('#totalSix').animateNumber(
            //  {
            //    number: totalSix.toFixed(7),
            //    numberStep: percent_number_step
            //  }
            //)
          } else {
            data.six_amount = Number((data.six_amount).toFixed(7))
              totalSix += data.six_amount
              //$('#totalSix').animateNumber(
              //{
              //number: totalSix.toFixed(7),
              //numberStep: percent_number_step
              //}
              //)
          }
          const elem = buildListTx(data)
          $("#userTxs")[0].appendChild(elem)
          $("#userTxs2")[0].appendChild(elem)
        })
      }).catch(() => {
        $('#userTxs').empty()
        let allDoc = []
        snapshot.forEach(d => {
          allDoc.push(d)
        })
        allDoc.sort(compare)
        var percent_number_step = $.animateNumber.numberStepFactories.append(' SIX')
        //$('#totalSix').animateNumber(
        //  {
        //    number: totalSix.toFixed(7),
        //    numberStep: percent_number_step
        //  }
        //);
        allDoc.forEach(d => {
          const data = d.data()
          const elem = buildListTx(data)
          $("#userTxs")[0].appendChild(elem)
          $("#userTxs2")[0].appendChild(elem)
        })
      })
    }).then(() => {
//      if (userData.alloc_transaction === true) {
//        const elem = buildListTx({ time: userData.alloc_time, native_amount: userData.alloc_transaction_amount, type: userData.alloc_transaction_type, to: '-', id: '-', six_amount: userData.alloc_transaction_six_amount, alloc_time: userData.alloc_time, tx_status: 'pending' })
//        $("#userTxs")[0].prepend(elem)
//      }
      if (userData.update_time === undefined || userData.update_time < 1527692400000) {
        const elem = buildFreeTx()
        $("#userTxs")[0].appendChild(elem)
        $("#userTxs2")[0].prepend(elem)
      }
    })
  }
}

function copyToClipboard (el, y, x) {
  //resolve the element
  el = (typeof el === 'string') ? document.querySelector(el) : el;
  // handle iOS as a special case
  if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
    // save current contentEditable/readOnly status
    var editable = el.contentEditable;
    var readOnly = el.readOnly;

    // convert to editable with readonly to stop iOS keyboard opening
    el.contentEditable = true;
    el.readOnly = true;

    // create a selectable range
    var range = document.createRange();
    range.selectNodeContents(el);

    // select the range
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    el.setSelectionRange(0, 999999);

    // restore contentEditable/readOnly to original state
    el.contentEditable = editable;
    el.readOnly = readOnly;
    success = document.execCommand('copy')
    console.log(success)
  }
  else {
    var textarea = document.createElement('textarea');
    textarea.textContent = el.val();
    console.log(el.val())
    document.body.appendChild(textarea)
    var selection = document.getSelection();
    var range = document.createRange();
    range.selectNode(textarea);
    selection.removeAllRanges();
    selection.addRange(range);
    success = document.execCommand('copy')
    console.log(success)
    selection.removeAllRanges();
    document.body.removeChild(textarea);
  }

  $("#copiedTooltip").css('top', y+'px')
  $("#copiedTooltip").css('left', x+'px')
  $("#copiedTooltip").addClass("showToolTip")
  setTimeout(function() { $("#copiedTooltip").removeClass("showToolTip") } , 400)
}

var randomedWords
var qrcode
var stellarUrl, issuerKey
$(document).ready(function(){
  $('#sendToEmailBtn').click(function(e) {
    e.preventDefault();
    sendCodeToEmail()
  })

  $('#sendToEmailBtn2').click(function(e) {
    e.preventDefault();
    sendCodeToEmailClaim()
  })

  // Variable

  var domain = window.location.href
  if (domain.match('localhost')) {
    stellarUrl = 'https://horizon-testnet.stellar.org'
    StellarSdk.Network.useTestNetwork()
    issuerKey = "GBVX36SLDLLXCVMGFLKNQ5XB76Z4SIXCFKYHKMSJTLANXB6AH27LUKEP"
  } else if (domain.match('six-dashboard')) {
    stellarUrl = 'https://horizon-testnet.stellar.org'
    StellarSdk.Network.useTestNetwork()
    issuerKey = "GBVX36SLDLLXCVMGFLKNQ5XB76Z4SIXCFKYHKMSJTLANXB6AH27LUKEP"
  } else if (domain.match('ico.six.network') || domain.match('sixdashboard')) {
    stellarUrl = 'https://horizon.stellar.org'
    StellarSdk.Network.usePublicNetwork()
    issuerKey = "GDMS6EECOH6MBMCP3FYRYEVRBIV3TQGLOFQIPVAITBRJUMTI6V7A2X6Z"
  } else {
    stellarUrl = 'https://horizon-testnet.stellar.org'
    StellarSdk.Network.useTestNetwork()
    issuerKey = "GBVX36SLDLLXCVMGFLKNQ5XB76Z4SIXCFKYHKMSJTLANXB6AH27LUKEP"
  }

  document.getElementById('otpCode').onkeydown = function() {
    if ($("#submitOTPError").css("display") === "block") {
      $("#submitOTPError").slideToggle()
    }
  }
  qrcode = new QRCode("qrcode");
  document.getElementById('oldP').onkeydown = function() {
    $('#oldAddress').removeClass("invalid")
    $("#alertOldAddress").html("")
  }

  let clipboard = new ClipboardJS('.blinkTooltip')
  clipboard.on('success', function(e) {
    let bodyRect = document.body.getBoundingClientRect()
    let react = e.trigger.getBoundingClientRect()
    $("#copiedTooltip").css('top', ((react.top-bodyRect.top)-40)+'px')
    $("#copiedTooltip").css('left', (react.left+((react.right-react.left)/2)-53)+'px')
    $("#copiedTooltip").addClass("showToolTip")
    setTimeout(function() { $("#copiedTooltip").removeClass("showToolTip") } , 400)
  })
  document.getElementById('walletETHinput').onkeydown = function() {
    $('#ethWalletAddressAlert').removeClass("invalid")
    $("#ethWalletAddressAlertText").html('')
    $("#ethWalletAddressAlertText").css('display', 'none')
  }

  document.getElementById('xlmToSixInput').onkeyup = function () {
    let number = parseFloat(this.value) || 0
    $("#xlmToSix").html(Number((number*xlmPrice.six_per_xlm).toFixed(7)).toLocaleString())
    $("#xlmToSixInputAlertText").html("")
    $("#xlmToSixInputAlertText").css("display", "none")
    $("#xlmToSixInputAlert").removeClass("invalid")
  }

  document.getElementById('ethToSixInput').onkeyup = function() {
    let number = parseFloat(this.value) || 0
    $("#ethToSix").html(Number((number*ethPrice.six_per_eth).toFixed(7)).toLocaleString())
    $("#ethToSixInputAlertText").html("")
    $("#ethToSixInputAlertText").css("display", "none")
    $("#ethToSixInputAlert").removeClass("invalid")
  }

  $("body").on("click", ".dashboard-2 aside .tab-header .eth-link", function(){
      $(".dashboard-2 aside .tab-container .video").removeClass("show");
      $(".dashboard-2 aside .tab-container .eth").addClass("show");
      $("#videoEmbed").attr('src', 'https://www.youtube.com/embed/LvHgV8D9Uj4?rel=0&showinfo=0&enablejsapi=1')
  });

  $("body").on("click", ".dashboard-2 aside .tab-header .stl-link", function(){
      $(".dashboard-2 aside .tab-container .video").removeClass("show");
      $(".dashboard-2 aside .tab-container .stl").addClass("show");
      $("#videoEmbed").attr('src', 'https://www.youtube.com/embed/_Yyowe7AWP8?rel=0&showinfo=0&enablejsapi=1')
  });
  $("body").on("click", ".tab-header a:not(.disabled)", function(){
      $(this).parent('.tab-header').find("a").removeClass("actived");
      $(this).addClass("actived");
  });

    // Dialog
    // Open
    $("body").on("click", ".open-dialog-video", function(){
        $('.dialog-video').addClass('show-dialog');
    });
    // Close
		$('body').on('click', '[class^="dialog-"] dialog', function(e){
      $('#videoEmbed').each(function(){
        this.contentWindow.postMessage('{"event":"command","func":"' + 'stopVideo' + '","args":""}', '*')
      });
			e.stopPropagation();
    });

    $('body').on('click', '[class^="dialog-"]', function(){
			$(this).removeClass('show-dialog');
      $("#otpCode").val("")
    });

    $('body').on('click', '[class^="dialog-"] dialog a.close', function(){
			$(this).parents('[class^="dialog-"]').removeClass('show-dialog');
		});

    $('body').on('click', '[class^="dialog-"] dialog a.close', function(){
			$(this).parents('[class^="dialog-"]').removeClass('show-dialog');
		});

  // Listening to auth state change
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      console.log('Go to login')
      window.location.href = '/'+window.location.search
    } else {
      initializeAdmin().then(() => {
        return $('#adminShortcut').css('display', 'block')
      }).catch(() => {}).then(() => {
        return firebase.firestore().collection('users').doc(user.uid).get().then(doc => {
          const endtime = endtimeOfIco
          if (!(Date.now() > endtime && doc.data().all_done) && doc.data().private_user !== true) {
            window.location.href = '/wizard'+window.location.search
          }
          userData = doc.data()
          let name = (userData.first_name || "") + " " + (userData.last_name || "")
          $("#displayName").html(name || "")
          $("#firstCharName").html((userData.first_name || "").substr(0,1).toUpperCase())
          $(".myMemo").html(userData.memo)
          $("#memoCopy").attr('data-clipboard-text', userData.memo)
          $("#welcomeBox").css("display", "none")
          $("#mainBox").css("display", "block")
          if (userData.eth_address !== undefined) {
            $("#myWallet").css("display", "block")
            $("#myETHaddress")[0].value = userData.eth_address
            $("#myETHWalletAddress").html(userData.eth_address)
            $("#myETHWalletAddress").attr('data-clipboard-text', userData.eth_address)
            $("#myAddressBtn").attr('data-clipboard-text', userData.eth_address)

          } else {
            $("#myETHaddress")[0].value = '-'
            $("#myETHWalletAddress").html('-')
            $("#myETHWalletAddress").attr('data-clipboard-text', '-')
            $("#myAddressBtn").attr('data-clipboard-text', '-')
          }
          if (userData.is_presale === true) {
            $("#bonusXLMText").css('display', 'block')
            $("#bonusETHText").css('display', 'block')
          }
          if ((new Date()) > closeIco) {
            goToClaim()
          }
          if (userData.submit_xlm_wallet === true) {
            if (userData.add_trust_line !== true) {
              if (userData.use_old_account !== true) {
                $(".dialog-reset").addClass("show-dialog")
                $("#claimBox").css("display", "block")
                $("#claimWelcomeBox").css("display", "none")
              } else {
                $("#trustlineStep").addClass("current")
                $("#walletSelectBox").css("display", "none")
                $("#claimWelcomeBox").css("display", "none")
                $("#claimBox").css("display", "block")
                $("#claimWelcomeBox").css("display", "none")
                $("#manualTrustlineBox").css("display", "block")
                $(".noWallet").removeClass("noWallet").addClass("haveWallet")
                getMyWalletBalance()
                qrcode.makeCode(userData.xlm_address);
                $("#myXlmPublicAddress").text(userData.xlm_address)
                $("#myXlmPublicAddress2").text(userData.xlm_address)
                $("#copyMyXlmAddress").attr("data-clipboard-text", userData.xlm_address)
              }
            } else {
              $("#trustlineStep").addClass("current")
              $("#walletSelectBox").css("display", "none")
              $("#claimWelcomeBox").css("display", "none")
              $("#claimBox").css("display", "block")
              $("#claimWelcomeBox").css("display", "none")
              $("#manualTrustlineBox").css("display", "block")
              $(".noWallet").removeClass("noWallet").addClass("haveWallet")
              getMyWalletBalance()
              qrcode.makeCode(userData.xlm_address);
              $("#myXlmPublicAddress").text(userData.xlm_address)
              $("#myXlmPublicAddress2").text(userData.xlm_address)
              $("#copyMyXlmAddress").attr("data-clipboard-text", userData.xlm_address)
            }
          }
          if (userData.add_trust_line === true) {
            $("#trustlineStep").addClass("current")
            $("#claimStep").addClass("current")
            $("#claimBox").css("display", "block")
            $("#claimWelcomeBox").css("display", "none")
            $("#rewardClaimBox").css("display", "block")
            $("#congratBox").css("display", "none")
            $("#walletSelectBox").css("display", "none")
            $("#claimWelcomeBox").css("display", "none")
            $("#manualTrustlineBox").css("display", "none")
            updateGraph()
          }
        }).then(getCurrentTotal).then(() => {
          getTxs()
          getClaims()
          setTimeout(function(){
            runGlobalNumber()
          }, 1000)
          $('#preLoader').fadeToggle()
          updatePrice()
        })
      })
    }
  })
  $('body').on('click', '.dropdown a', function() {
    var dropdown = $(this).parent(".dropdown");

    dropdown.toggleClass("show-dropdown");

    clickBody('dropdown', dropdown, 'show-dropdown');
  });

})

// Click body for close
function clickBody(name, elem, rm_class) {
  if ( elem.hasClass(rm_class) ) {
    $('body').on('click.'+name, function(){
      elem.removeClass(rm_class);
      $('body').off('click.'+name);
    });
  }
}

function goToClaim() {
  $("#welcomeBox").css("display", "none")
  $("#questionBox").css("display", "none")
  $("#submitXLMBox").css("display", "none")
  $("#submitETHBox").css("display", "none")
  $("#depositETHBox").css("display", "none")
  $("#depositXLMBox").css("display", "none")
  $("#mainBox").css("display", "none")
  $("#congratulationBox").css("display", "none")
  $("#walletBox").css("display", "none")
  $("#warnBox").css("display", "none")
  $("section.video").css("display", "none")
  $("section#myWallet").css("display", "none")
  $(".dashboard-2 aside hr").css("display", "none")
  $("section#progressContent").css("display", "none")
  $("#showXLMWalletBtn").css("display", "flex")
  $("#claimBox").css("display", "none")
  $("#claimWelcomeBox").css("display", "block")
}

function generateNewAccount() {
  var pair = StellarSdk.Keypair.random()
  $("#genP").val(pair.publicKey())
  $("#genS").val(pair.secret())
}

function goToClaimTable(type) {
  if (type === "ledger") {
    $("#congratBoxLedger").slideToggle(100)
  } else {
    $("#congratBox").slideToggle(100)
  }
  $("#rewardClaimBox").slideToggle(100, function() {
    updateGraph()
  })
}

var mainGraph
function updateGraph() {
  let allClaim = 0
  let allAvailable = 0
  let claimedItems = $(".claimListItem.stillClaimed")
  for(let i = 0; i < claimedItems.length; i++) {
    allClaim += parseFloat($(claimedItems[i]).attr("total-amount"))
  }
  let notAvailItems = $(".claimListItem.stillNotAvail")
  for(let i = 0; i < notAvailItems.length; i++) {
    allAvailable += parseFloat($(notAvailItems[i]).attr("total-amount"))
  }
  let availItems = $(".claimListItem.stillAvail")
  for(let i = 0; i < availItems.length; i++) {
    allAvailable += parseFloat($(availItems[i]).attr("total-amount"))
  }
  if (mainGraph === undefined) {
    mainGraph = Morris.Donut({
      element: 'donut-graph',
      data: [
        {label: "Claimed", value: 0},
        {label: "Not Claimed", value: 0}
      ],
      colors: ['#4a5ab5', '#B7B7B7']
    })
  } else {
    mainGraph.setData([
      {
        label: "Claimed",
        value: allClaim
      },
      {
        label: "Not Claimed",
        value: allAvailable
      }
    ])
  }
  var percent_number_step = $.animateNumber.numberStepFactories.append(' SIX')
  $('#totalClaimedSix').animateNumber(
    {
      number: allClaim.toFixed(7),
      numberStep: percent_number_step
    }
  );
}

function nextGeneratedAccount() {
  $("#showWordNew").fadeToggle(100, () => {
    $("#answerWordNew").fadeToggle(100)
  })
}

function goBackToMnemonic() {
  $("#answerWordNew").fadeToggle(100, () => {
    answerMnemonic = {}
    indexAnswerMnemonic = {}
    lastIndexMnemonic = 0
    let usedWord = $(".usedWord")
    for(let i = 0; i < usedWord.length; i++) {
      let oldDom = document.getElementById('mnemonicAnswer'+usedWord[i].text.trim())
      oldDom.remove()
    }
    $(".usedWord").removeClass("usedWord").addClass("unusedWord")
    $("#showWordNew").fadeToggle(100)
  })
}

function goToRepeat() {
  $( "#accordion" ).accordion({
    active: 2
  });
}

function backGeneratedAccount() {
  $("#divClaimBoxNew").css("display", "block")
  $("#makeSureBoxNew").css("display", "none")
}

function checkTrustAccount() {
  if ($("#checkTrustError").css("display") === "block") {
    $("#checkTrustError").slideToggle()
  }
  let stellarUrl
  var domain = window.location.href
  if (domain.match('localhost')) {
    stellarUrl = 'https://horizon-testnet.stellar.org'
    StellarSdk.Network.useTestNetwork()
  } else if (domain.match('six-dashboard')) {
    stellarUrl = 'https://horizon-testnet.stellar.org'
    StellarSdk.Network.useTestNetwork()
  } else if (domain.match('ico.six.network') || domain.match('sixdashboard')) {
    stellarUrl = 'https://horizon.stellar.org'
    StellarSdk.Network.usePublicNetwork()
  } else {
    stellarUrl = 'https://horizon-testnet.stellar.org'
    StellarSdk.Network.useTestNetwork()
  }
  const server = new StellarSdk.Server(stellarUrl)
  let accountCaller = server.accounts()
  accountCaller.accountId(userData.xlm_address)
  let btnDOM = document.getElementById("checkTrustAccountBtn")
  setDisable([btnDOM])
  accountCaller.call().then(account => {
    let sixAsset = account.balances.find(x => { return x.asset_code == 'SIX' })
    if (sixAsset !== undefined) {
      markTrustlineUser().then(() => {
        $("#manualTrustlineBox").slideToggle(100)
        $("#rewardClaimBox").slideToggle(100, function() {
          updateGraph()
        })
        $("#claimStep").addClass("current")
        qrcode.makeCode(userData.xlm_address);
        $("#myXlmPublicAddress").text(userData.xlm_address)
        $("#myXlmPublicAddress2").text(userData.xlm_address)
        $("#copyMyXlmAddress").attr("data-clipboard-text", userData.xlm_address)
        $(".noWallet").removeClass("noWallet").addClass("haveWallet")
        getMyWalletBalance()
      }).catch(err => {
        setEnable([btnDOM])
        console.log(err)
      })
    } else {
      setEnable([btnDOM])
    }
  }).catch(err => {
    setEnable([btnDOM])
    $("#checkTrustError").text("Trustline is not properly trusted")
    if ($("#checkTrustError").css("display") === "none") {
      $("#checkTrustError").slideToggle()
    }
  })
}

function submitGeneratedAccount() {
  const btnDOM = document.getElementById('submitGAccountBtn')
  const btn2DOM = document.getElementById('backAccountBtn')
  let splittedWords = mnemonicWords.split(" ")
  let validate = true
  for(var key in answerMnemonic) {
    if (splittedWords[answerMnemonic[key]] != key) {
      validate = false
      $("#mnemonicAnswerShowing").addClass("customAlert")
    }
  }
  if (Object.keys(answerMnemonic).length != 12) {
    validate = false
    $("#mnemonicAnswerShowing").addClass("customAlert")
    $("#mnemonicError").text("An order of recovery words is invalid")
  }
  if (validate === false) {
    return false
  }
  setDisable([btnDOM, btn2DOM])
  $("#accordion").fadeToggle(100, function() {
    $("#overAllLoadingContainer").css("display", "flex")
    $("#progressContainer").fadeToggle(function() {
      $("#accountPg").css('width', '25%')
      setTimeout(function(){
        $("#accountPg").css('width', '50%')
        $("#progressText").html("Activate your address")
        requestFunction = firebase.functions().httpsCallable('createClaim')
        requestFunction({public_key: generatedWallet.getPublicKey(0)}).then(response => {
          $("#accountPg").css('width', '75%')
          $("#trustlineStep").addClass("current")
          $("#progressText").html("Changing trustline")
          automatedChangeTrustToSix().then(response => {
            markTrustlineUser().then(() => {
              $("#accountPg").css('width', '100%')
              $("#progressText").html("Yay ! Your address is now ready")
              setTimeout(function(){
                $("#genP").val(generatedWallet.getPublicKey(0))
                $("#genS").val(generatedWallet.getSecret(0))
                $("#claimStep").addClass("current")
                $("#divClaimBoxNew").slideToggle()
                $("#overAllLoadingContainer").slideToggle()
                $("#congratBox").slideToggle()
                qrcode.makeCode(generatedWallet.getPublicKey(0));
                $("#myXlmPublicAddress").text(generatedWallet.getPublicKey(0))
                $("#myXlmPublicAddress2").text(generatedWallet.getPublicKey(0))
                userData.xlm_address = generatedWallet.getPublicKey(0)
                $("#copyMyXlmAddress").attr("data-clipboard-text", generatedWallet.getPublicKey(0))
                $(".noWallet").removeClass("noWallet").addClass("haveWallet")
                getMyWalletBalance()
              }, 2000);
            }).catch(err => {
              console.log(err)
            })
          }).catch(err => {
            console.log(err)
          })
        }).catch(err => {
          console.log(err)
        })
      }, 1200);
    })
  })
}

function markTrustlineUser() {
  const requestFunction = firebase.functions().httpsCallable('updateTrustline')
  return requestFunction({})
}

function submitOTP(id) {
  if ($("#submitOTPError").css("display") === "block") {
    $("#submitOTPError").slideToggle()
  }
  const btnDOM = document.getElementById('otpSubmitBtn')
  setDisable([btnDOM])
  const requestFunction = firebase.functions().httpsCallable('claimOTPSubmit')
  requestFunction({ref_code: $("#refVerify2").text(), code: $("#otpCode").val(), claim_id: String(id)}).then(response => {
    console.log(response)
    if (response.data.success === true) {
      $("#otpDialog").removeClass('show-dialog');
      $("#claim-"+id).removeClass("avail").addClass("claimed")
      setDisable([$("#claim-"+id)[0]])
      $("#claim-"+id).text("Processing")
      $("#claim-"+id).addClass("processing").removeClass("avail")
      //$("#claim-"+id).parent().parent().removeClass("stillAvail").addClass("stillClaimed")
      updateGraph()
      $("#otpCode").val("")
      if (localStorage[userData.uid+"seen_waitting"] === undefined) {
        $(".dialog-waitting").addClass("show-dialog")
        localStorage[userData.uid+"seen_waitting"] = true
      }
    } else {
      $("#submitOTPError").text(response.data.error_message)
      if ($("#submitOTPError").css("display") === "none") {
        $("#submitOTPError").slideToggle()
      }
      setEnable([btnDOM])
    }
    //setEnable([btnDOM])
  }).catch(err => {
     alert(err);
     setEnable([btnDOM]);
     $("#otpDialog").removeClass('show-dialog');
     $("#otpCode").val("");
  })
}

function claimSix(id) {
  if ($("#submitOTPError").css("display")) {
    $("#submitOTPError").css("display", "none")
  }
  clearInterval(intervalFunction)
  const btnDOM = document.getElementById('claim-'+id)
  const btn2DOM = document.getElementById('otpSubmitBtn')
  setEnable([btn2DOM])
  setDisable([btnDOM])
  let requestFunction = firebase.functions().httpsCallable('claimVerificationRequest')
  requestFunction({claim_id: id}).then(response => {
    if (response.data.success === true) {
      $("#otpDialog").addClass("show-dialog")
      $('#refVerify2').html(response.data.ref_code)
      $('#refPhoneNumber2').html(response.data.phone_number)
      clearInterval(intervalFunction)
      let otpSubmitBtn = document.getElementById('otpSubmitBtn')
      otpSubmitBtn.onclick = function() {
        submitOTP(id)
      }

      let otpSubmitBtn2 = document.getElementById('sendToEmailBtn2')
      otpSubmitBtn2.onclick = function() {
        sendCodeToEmailClaim(id)
      }

      $("#sendToEmailBtn2").css("display", "none")
      $("#sendToEmailError2").css("display", "none")

      // Countdown verify
      'use strict'
      function countdown (options = {}) {
        let defaults = { cssClass: '.countdown-verify-2'
        }
        let settings = Object.assign({}, defaults, options),
          startNum = settings.fromNumber,
          firstNum = settings.fromNumber,
          block = document.querySelector(settings.cssClass)
        function appendText () {
          let countText = `<p class="countdown-number">${startNum}</p>`
          block.innerHTML = countText
          startNum--
        }
        function count () {
          if (startNum < 0) {
            startNum = settings.fromNumber
          } else {
            if (startNum < firstNum-60) {
              $("#sendToEmailBtn2").css("display", "inline-block")
            } else {
              $("#sendToEmailBtn2").css("display", "none")
            }
            appendText()
          }
          if (startNum == 0) {
            $("#otpDialog").removeClass('show-dialog')
          }
        }
        appendText()
        intervalFunction = setInterval(() => { count() }, 1000)
      }
      let countDownNum = response.data.valid_until - Math.round((new Date()).getTime() / 1000)
      countdown({ fromNumber: countDownNum })
    }
    setEnable([btnDOM])
  }).catch(() => {
    setEnable([btnDOM])
  })
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

var generatedWallet
var mnemonicWords
function goToGenerateNewWallet() {
  $("#trustlineStep").addClass("current")
  $("#walletSelectBox").css("display", 'none')
  for (;;) {
    mnemonic = StellarHDWallet.generateMnemonic({entropyBits: 128})
    let arr = mnemonic.split(" ")
    var sorted_arr = arr.slice().sort();
    var results = [];
    for (var i = 0; i < sorted_arr.length - 1; i++) {
      if (sorted_arr[i + 1] == sorted_arr[i]) {
        results.push(sorted_arr[i]);
      }
    }
    if (results.length == 0) {
      break
    }
  }
  mnemonicWords = mnemonic
  let splittedWords = mnemonicWords.split(" ")
  let showDOM = document.getElementById("mnemonicShowing")
  let choiceDOM = document.getElementById("answerMnemonicShowing")
  let shuffleWords = splittedWords.slice(0)
  shuffleWords = shuffle(shuffleWords)
  for(let i = 0; i < splittedWords.length; i++) {
    let span = document.createElement("span")
    let txt = document.createTextNode((i+1)+"."+splittedWords[i]+"\n")
    span.append(txt)
    showDOM.append(span)
  }
  for(let j = 0; j < shuffleWords.length; j++) {
    let span2 = document.createElement("span")
    let adom = document.createElement("a")
    adom.href = 'javascript:;'
    let txt2 = document.createTextNode(shuffleWords[j]+"\n")
    span2.append(txt2)
    adom.append(span2)
    adom.className = "unusedWord"
    adom.id = 'choiceAnswer'+shuffleWords[j]
    adom.onclick = function() { submitAnswerMnemonic(shuffleWords[j]) }
    choiceDOM.append(adom)
  }
  let generatedwallet = StellarHDWallet.fromMnemonic(mnemonic)
  generatedWallet = generatedwallet
  $("#genS").val(generatedwallet.getSecret(0))
  $("#genP").val(generatedwallet.getPublicKey(0))
  $("#copyGenP").attr("data-clipboard-text", generatedwallet.getPublicKey(0))
  $("#copyGenS").attr("data-clipboard-text", generatedwallet.getSecret(0))
  $("#genM").val(mnemonic)
  $("#divClaimBoxNew").css("display", 'block')
//  $( "#accordion" ).accordion();
//  $( "#accordion" ).accordion({
//    beforeActivate: function( event, ui ) {
//      answerMnemonic = {}
//      indexAnswerMnemonic = {}
//      lastIndexMnemonic = 0
//      let usedWord = $(".usedWord")
//      for(let i = 0; i < usedWord.length; i++) {
//        let oldDom = document.getElementById('mnemonicAnswer'+usedWord[i].text.trim())
//        oldDom.remove()
//      }
//      $(".usedWord").removeClass("usedWord").addClass("unusedWord")
//    }
//  })
}

var answerMnemonic = {}
var indexAnswerMnemonic = {}
var lastIndexMnemonic = 0
function submitAnswerMnemonic(word) {
  $("#mnemonicAnswerShowing").removeClass("customAlert")
  $("#mnemonicError").text(" ")
  if (answerMnemonic[word] === undefined) {
    let newSpan = document.createElement("span")
    let newTxt = document.createTextNode((lastIndexMnemonic+1)+"."+word+"\n")
    newSpan.append(newTxt)
    newSpan.id = 'mnemonicAnswer'+word
    let answerBoard = document.getElementById('mnemonicAnswerShowing')
    answerBoard.append(newSpan)
    answerMnemonic[word] = lastIndexMnemonic
    indexAnswerMnemonic[lastIndexMnemonic] = word
    let btnDom = document.getElementById('choiceAnswer'+word)
    $(btnDom).removeClass("unusedWord").addClass("usedWord")
    lastIndexMnemonic++
  } else {
    let oldDom = document.getElementById('mnemonicAnswer'+word)
    oldDom.remove()
    let thisIndex = answerMnemonic[word]
    answerMnemonic[word] = undefined
    indexAnswerMnemonic[thisIndex] = undefined
    for(let i = (thisIndex+1); i < lastIndexMnemonic; i++) {
      let thisWord = indexAnswerMnemonic[i]
      answerMnemonic[thisWord] = i-1
      indexAnswerMnemonic[i-1] = thisWord
      indexAnswerMnemonic[i] = undefined
      let oldElement = document.getElementById('mnemonicAnswer'+thisWord)
      oldElement.textContent = oldElement.textContent.replace(String(i+1), String(i))
    }
    let btnDom = document.getElementById('choiceAnswer'+word)
    $(btnDom).removeClass("usedWord").addClass("unusedWord")
    lastIndexMnemonic--
  }
}

function goToOldWallet() {
  $("#trustlineStep").addClass("current")
  $("#walletSelectBox").css("display", 'none')
  $("#divClaimBoxOld").css("display", 'block')
}

function automatedChangeTrustToSix() {
  const server = new StellarSdk.Server(stellarUrl)
  let userWallet = StellarSdk.Keypair.fromSecret(generatedWallet.getSecret(0))
  return server.loadAccount(generatedWallet.getPublicKey(0)).then(account => {
    let transaction = new StellarSdk.TransactionBuilder(account)
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: new StellarSdk.Asset("SIX", issuerKey)
        })
      )
      .build()
    transaction.sign(userWallet)
    return server.submitTransaction(transaction)
  })
}

function submitOldAccount() {
  if ($("#oldWalletAlert").css("display") === 'block') {
    $("#oldWalletAlert").slideToggle()
  }
  const oldAccount = document.getElementById('oldP')
  if (/[A-Z]/.test(oldAccount.value) == false) {
    $("#oldAddress").addClass("invalid")
    $("#alertOldAddress").html("Invalid address format")
    return true
  }
  let requestFunction = firebase.functions().httpsCallable('updateXLMWallet')
  const oldXlmAddressDOM = document.getElementById('oldP')
  const btnDOM = document.getElementById('submitOldAccountBtn')
  const xlmAddress = oldXlmAddressDOM.value.trim()
  setDisable([btnDOM, oldXlmAddressDOM])
  requestFunction({xlm_address: xlmAddress}).then(response => {
    if (response.data.success === true) {
      setEnable([btnDOM, oldXlmAddressDOM])
      $("#divClaimBoxOld").css("display", "none")
      $("#manualTrustlineBox").css("display", "block")
      $("#trustlineStep").addClass("current")
      userData.xlm_address = xlmAddress
    } else {
      $("#oldWalletAlertText").html(response.data.error_message)
      if ($("#oldWalletAlert").css("display") === 'none') {
        $("#oldWalletAlert").slideToggle()
      }
      setEnable([btnDOM, oldXlmAddressDOM])
    }
  })
}

function downloadMnemonic() {
  let dom = document.getElementById("submitG2AccountBtn515")
  setEnable([dom])
  let splittedWords = mnemonicWords.split(" ")
  let data = `SIX.Network Recovery words (Mnemonic words) :

1. ${splittedWords[0]}
2. ${splittedWords[1]}
3. ${splittedWords[2]}
4. ${splittedWords[3]}
5. ${splittedWords[4]}
6. ${splittedWords[5]}
7. ${splittedWords[6]}
8. ${splittedWords[7]}
9. ${splittedWords[8]}
10. ${splittedWords[9]}
11. ${splittedWords[10]}
12. ${splittedWords[11]}`

var doc = new jsPDF()
doc.setFontSize(12)
doc.text(data,10,10)
doc.save('six_stellar_wallet_recovery_words_'+userData.email+'.pdf')
}

function downloadGeneratedAccount() {
  let nextBtnDOM = document.getElementById("submitG3AccountBtn")
  setEnable([nextBtnDOM])
  $('.dialog-congrat').addClass('show-dialog')
  let data = `Public Key :
   ${generatedWallet.getPublicKey(0)}
Secret Key :
   ${generatedWallet.getSecret(0)}`

var doc = new jsPDF()
doc.setFontSize(12)
doc.text(data,10,10)
doc.save('six_stellar_wallet_credentials_'+userData.email+'.pdf')
}

function downloadAddress() {
  let data = "Public Key : "+userData.xlm_address
  var doc = new jsPDF()
  doc.setFontSize(12)
  doc.text(data,10,10)
  doc.save('six_stellar_wallet_credentials_'+userData.email+'.pdf')
}

var toggleSecretshow = false
var toggleSecretshow2 = false
var toggleSecretMnemonicShow2 = false
var toggleSecretMnemonicShow = false

function toggleSecret() {
  if (toggleSecretshow == false) {
    $("#toggleSecret").removeClass("fa-eye").addClass("fa-eye-slash")
    $("#genS").attr("type", "text")
    toggleSecretshow = true
  } else {
    $("#toggleSecret").removeClass("fa-eye-slash").addClass("fa-eye")
    $("#genS").attr("type", "password")
    toggleSecretshow = false
  }
}

function toggleSecretMnemonic() {
  if (toggleSecretMnemonicShow == false) {
    $("#toggleSecretMnemonic").removeClass("fa-eye").addClass("fa-eye-slash")
    $("#genM").attr("type", "text")
    toggleSecretMnemonicShow = true
  } else {
    $("#toggleSecretMnemonic").removeClass("fa-eye-slash").addClass("fa-eye")
    $("#genM").attr("type", "password")
    toggleSecretMnemonicShow = false
  }
}

function toggleSecret2() {
  if (toggleSecretshow == false) {
    $("#toggleSecret2").removeClass("fa-eye").addClass("fa-eye-slash")
    $("#reS").attr("type", "text")
    toggleSecretshow = true
  } else {
    $("#toggleSecret2").removeClass("fa-eye-slash").addClass("fa-eye")
    $("#reS").attr("type", "password")
    toggleSecretshow = false
  }
}

function toggleSecretMnemonic2() {
  if (toggleSecretMnemonicShow == false) {
    $("#toggleSecretMnemonic2").removeClass("fa-eye").addClass("fa-eye-slash")
    $("#reM").attr("type", "text")
    toggleSecretMnemonicShow = true
  } else {
    $("#toggleSecretMnemonic2").removeClass("fa-eye-slash").addClass("fa-eye")
    $("#reM").attr("type", "password")
    toggleSecretMnemonicShow = false
  }
}

var intervalFunction

function requestOTP() {
  $("#requestOTPContent").slideToggle()
  $("#submitOTPContent").slideToggle()
  clearInterval(intervalFunction)
  // Countdown verify
  'use strict'
  function countdown (options = {}) {
    let defaults = { cssClass: '.countdown-verify'
    }
    let settings = Object.assign({}, defaults, options),
      startNum = settings.fromNumber,
      block = document.querySelector(settings.cssClass)
    function appendText () {
      let countText = `<p class="countdown-number">${startNum}</p>`
      block.innerHTML = countText
      startNum--
    }
    function count () {
      if (startNum < 0) {
        startNum = settings.fromNumber
      } else {
        appendText()
      }
      if (startNum == 0) {
        $("#requestOTPContent").slideToggle()
        $("#submitOTPContent").slideToggle()
      }
    }
    appendText()
    intervalFunction = setInterval(() => { count() }, 1000)
  }
//  let countDownNum = response.data.valid_until - Math.round((new Date()).getTime() / 1000)
  countdown({ fromNumber: 180 })
}

function wcNext() {
  if (userData.phone_number !== undefined && userData.phone_verified === true) {
    $("#claimBox").css("display", "block")
    $("#claimWelcomeBox").css("display", "none")
  } else {
    $('#verifyPhoneContent').css("display", "block")
    $("#welcomeContentContainer").css("display", "none")
  }
}

function submitDialog() {
  $('[class^="dialog-"]').removeClass('show-dialog')
}

function submitDialogError() {
  window.location.href = "https://m.me/thesixnetwork"
  submitDialog()
}

function nextDialog() {
  $("#congratDialogContent1").fadeToggle(100, () => { $("#congratDialogContent2").fadeToggle(100) })
}

function backDialog() {
  $("#congratDialogContent2").fadeToggle(100, () => { $("#congratDialogContent1").fadeToggle(100) })
}

function goToFee() {
  $("#recoverWordDialogContent").fadeToggle(100, () => { $("#feeDialogContent").fadeToggle(100) })
}

var walletOpen = false

function showXLMWallet() {
  if ($(".noWallet").length == 0) {
    if (walletOpen == true) {
      $("#xlmWalletIcon2").removeClass("fa-caret-down").addClass("fa-caret-left")
      walletOpen = false
      $("#showXLMWalletSection").css("display", "none");
    } else {
      $("#xlmWalletIcon2").removeClass("fa-caret-left").addClass("fa-caret-down")
      walletOpen = true
      $("#showXLMWalletSection").css("display", "block");
    }
  } else {
  }
}

function changeToPublicTable() {
  $("#privateTablebtn").removeClass("currentActive")
  $("#publicTablebtn").addClass("currentActive")
  $(".privateTable").css("display", "none")
  $(".publicTable").css("display", "block")
}

function changeToPrivateTable() {
  $("#publicTablebtn").removeClass("currentActive")
  $("#privateTablebtn").addClass("currentActive")
  $(".publicTable").css("display", "none")
  $(".privateTable").css("display", "block")
}

function goToLedgerWallet() {
  $("#trustlineStep").addClass("current")
  $("#walletSelectBox").css("display", 'none')
  $("#divClaimBoxLedger").css("display", 'block')
}

function submitPhoneNumber() {
  if ($("#verifyPhoneError").css("display") === "block") {
    $("#verifyPhoneError").slideToggle()
  }
  if ($("#verifyPhoneSubmitError").css("display") === "block") {
    $("#verifyPhoneSubmitError").slideToggle()
  }
  let phoneNumberDOM = document.getElementById('verifyPhonePhonenumber')
  let countryPhoneDOM = document.getElementById('kycCountryPhone')
  const countryPhone = countryPhoneDOM.value
  const parseData = libphonenumber.parse(phoneNumberDOM.value, countryPhone, {extended: true })
  let btnDOM = document.getElementById('verifyPhoneBtn')
  setDisable([phoneNumberDOM, btnDOM, countryPhoneDOM])
  if (parseData.valid === false) {
    $("#verifyPhoneError").html("Invalid phone number format")
    if ($("#verifyPhoneError").css("display", "none")) {
      $("#verifyPhoneError").slideToggle()
    }
    setEnable([phoneNumberDOM, btnDOM, countryPhoneDOM])
    return false
  }
  const phone_number = '+'+parseData.countryCallingCode+parseData.phone
  phoneNumberDOM.value = phone_number
  let requestFunction = firebase.functions().httpsCallable('phoneVerificationRequest')
  requestFunction({phone_number: phone_number}).then(response => {
    if (response.data.success === true) {
      $('#verifyCodeContent1').removeClass('show-detail')
      $('#verifyCodeContent2').addClass('show-detail')
      $('#refVerify').html(response.data.ref_code)
      $('#refPhoneNumber').html(phone_number)
      $("#sendToEmailBtn").css("display", "none")
      $("#sendToEmailError").css("display", "none")
      clearInterval(intervalFunction)
      // Countdown verify
      'use strict'
      function countdown (options = {}) {
        let defaults = { cssClass: '.countdown-verify'
        }
        let settings = Object.assign({}, defaults, options),
          startNum = settings.fromNumber,
          firstNum = settings.fromNumber,
          block = document.querySelector(settings.cssClass)
        function appendText () {
          let countText = `<p class="countdown-number">${startNum}</p>`
          block.innerHTML = countText
          startNum--
        }
        function count () {
          if (startNum < 0) {
            startNum = settings.fromNumber
          } else {
            if (startNum < firstNum-60) {
              $("#sendToEmailBtn").css("display", "inline-block")
            } else {
              $("#sendToEmailBtn").css("display", "none")
            }
            appendText()
          }
          if (startNum == 0) {
            $('#verifyCodeContent2').removeClass('show-detail')
            $('#verifyCodeContent1').addClass('show-detail')
          }
        }
        appendText()
        intervalFunction = setInterval(() => { count() }, 1000)
      }
      let countDownNum = response.data.valid_until - Math.round((new Date()).getTime() / 1000)
      countdown({ fromNumber: countDownNum })
    } else {
      $("#verifyPhoneError").html(response.data.error_message)
      if ($("#verifyPhoneError").css("display", "none")) {
        $("#verifyPhoneError").slideToggle()
      }
    }
    setEnable([phoneNumberDOM, btnDOM, countryPhoneDOM])
  }).catch(() => {
    $("#verifyPhoneError").html("Unexpected error, please try again")
    if ($("#verifyPhoneError").css("display", "none")) {
      $("#verifyPhoneError").slideToggle()
    }
    setEnable([phoneNumberDOM, btnDOM, countryPhoneDOM])
  })
}

function submitPhoneNumberCode() {
  if ($("#verifyPhoneSubmitError").css("display", "block")) {
    $("#verifyPhoneSubmitError").slideToggle()
  }
  let countryPhoneDOM = document.getElementById('kycCountryPhone')
  const countryPhone = countryPhoneDOM.value
  let phoneNumberDOM = document.getElementById('verifyPhonePhonenumber')
  const phone_number = phoneNumberDOM.value
  let codeDOM = document.getElementById('verifyCode')
  let btnDOM = document.getElementById('verifyPhoneSubmitBtn')
  const code = codeDOM.value
  setDisable([codeDOM, btnDOM])
  let requestFunction = firebase.functions().httpsCallable('phoneVerificationSubmit')
  requestFunction({phone_number: phone_number, country: countryPhone, ref_code: $('#refVerify').html(), code: code}).then(response => {
    if (response.data.success === true) {
      $("#claimBox").css("display", "block")
      $("#claimWelcomeBox").css("display", "none")
    } else {
      $("#verifyPhoneSubmitError").html(response.data.error_message)
      if ($("#verifyPhoneSubmitError").css("display", "none")) {
        $("#verifyPhoneSubmitError").slideToggle()
      }
    }
    setEnable([codeDOM, btnDOM])
  }).catch(() => {
    $("#verifyPhoneSubmitError").html("Unexpected error, please try again")
    if ($("#verifyPhoneSubmitError").css("display", "none")) {
      $("#verifyPhoneSubmitError").slideToggle()
    }
    setEnable([codeDOM, btnDOM])
  })
}

function showPreviousTxs() {
  if ($("#previousTableContainer").css("display") === "none") {
    $("#previousTableContainer").css("display", "block")
  } else {
    $("#previousTableContainer").css("display", "none")
  }
}

var currentChoice = "new"

function selectChoice(choice) {
  $("#newChoice").removeClass("active")
  $("#oldChoice").removeClass("active")
  $("#ledgerChoice").removeClass("active")
  if (choice == "new") {
    $("#newChoice").addClass("active")
    currentChoice = "new"
  } else if (choice == "old") {
    $("#oldChoice").addClass("active")
    currentChoice = "old"
  } else {
    $("#ledgerChoice").addClass("active")
    currentChoice = "ledger"
  }
}

function nextWay() {
  if (currentChoice == "new") {
    goToGenerateNewWallet()
  } else if (currentChoice == "old") {
    goToOldWallet()
  } else {
    goToLedgerWallet()
  }
}

function nextRecoveryWord() {
  $("#dialogRecov1").fadeToggle(100, function() {
    $("#dialogRecov2").fadeToggle(100)
  })
}

function backRecoveryWord() {
  $("#dialogRecov2").fadeToggle(100, function() {
    $("#dialogRecov1").fadeToggle(100)
  })
}

function nextRecoveryWord2() {
  $("#dialogRecov2").css("display", 'none')
  $("#newClaimContent").css("display", 'block')
//  $( "#accordion" ).accordion();
//  $( "#accordion" ).accordion({
//    beforeActivate: function( event, ui ) {
//      answerMnemonic = {}
//      indexAnswerMnemonic = {}
//      lastIndexMnemonic = 0
//      let usedWord = $(".usedWord")
//      for(let i = 0; i < usedWord.length; i++) {
//        let oldDom = document.getElementById('mnemonicAnswer'+usedWord[i].text.trim())
//        oldDom.remove()
//      }
//      $(".usedWord").removeClass("usedWord").addClass("unusedWord")
//    }
//  })
}

function nextFirstLedger() {
  $("#newLedgerDialog").css("display", "none")
  $("#ledgerBox").css("display", "block")
  clickStrPublicKey(function(pk){
    $("#ledgerContentContainer").addClass("active")
    $("#ledgerAgreement #warning10").prop("disabled",false)
    $("#assetContent span").text(pk)
  })
}

function unlockLedger() {
  $("#ledgerContentContainer").addClass("active")
  const checkbox = document.getElementById("warning10")
  setEnable([checkbox])
  $("#ledgerContentContainer h3").text("Ledger wallet found and connected")
}

function checkWarningLedger() {
  const warning1DOM = document.getElementById('warning10')
  if (warning1DOM.checked) {
    const btnDOM = document.getElementById('submitLedgerBtn')
    setEnable([btnDOM])
  } else {
    const btnDOM = document.getElementById('submitLedgerBtn')
    setDisable([btnDOM])
  }
}

function signinWithLedger() {
  let activeledger = $("#ledgerContentContainer").hasClass("active")
  if(activeledger) {
    requestFunction = firebase.functions().httpsCallable('createClaim')
    let publicKey = $("#assetContent span").text().trim()
    $("#submitLedgerBtn").prop("disabled",true)
    requestFunction({public_key: publicKey}).then(response => {
      if (response.data.success) {
        $("#ledgerBox").css("display", "none")
        $("#newLedgerDialog2").css("display", "block")
        $("#ledgerDialogNextBtn2").prop("disabled",false)
      } else {
        $("#walletBox").css("display", "block")
        $("#submitWalletAlertText").html(response.data.error_message)
        if ($("#submitWalletAlert").css("display") === 'none') {
          $("#submitWalletAlert").slideToggle()
        }
      }
    })
  }
}

function confirmTrustLedger() {
  const btn = document.getElementById("ledgerDialogNextBtn2")
  setEnable([btn])
}

function addTrustLedger() {
  let publicKey = $("#assetContent span").text().trim()
  $("#ledgerDialogNextBtn2").prop("disabled",true)
  return trustSix(publicKey, issuerKey,function(data){
    return markTrustlineUser().then(() => {
      qrcode.makeCode(publicKey);
      userData.xlm_address = publicKey
      $("#myXlmPublicAddress").text(publicKey)
      $("#myXlmPublicAddress2").text(publicKey)
      $("#copyMyXlmAddress").attr("data-clipboard-text", publicKey)
      $(".noWallet").removeClass("noWallet").addClass("haveWallet")
      getMyWalletBalance()
      $("#claimStep").addClass("current")
      $("#divClaimBoxLedger").slideToggle(100)
      $("#rewardClaimBox").slideToggle(100, function() {
        updateGraph()
      })
    })
  }).catch(err => {
    $(".dialog-ledger-trustline").addClass("show-dialog")
    $("#ledgerDialogNextBtn2").prop("disabled",false)
  })
}

function sendCodeToEmail() {
  if ($("#sendToEmailError").css("display") === "block") {
    $("#sendToEmailError").slideToggle()
  }
  let dom = document.getElementById("sendToEmailBtn")
  setDisable([dom])
  let phoneNumberDOM = document.getElementById('verifyPhonePhonenumber')
  let phoneNumber = phoneNumberDOM.value
  sentEmail = firebase.functions().httpsCallable('sendPhoneVerficationtoEmail')
  sentEmail({phone_number: phoneNumber }).then(data => {
    $("#sendToEmailError").removeClass("error")
    if ($("#sendToEmailError").css("display") === "none") {
      $("#sendToEmailError").text("Email successfully sent")
      $("#sendToEmailError").slideToggle()
    }
  }).catch(err => {
    $("#sendToEmailError").addClass("error")
    if ($("#sendToEmailError").css("display") === "none") {
      $("#sendToEmailError").text("Unknow error occured.")
      $("#sendToEmailError").slideToggle()
    }
  }).then(() => {
    setEnable([dom])
  })
}

function sendCodeToEmailClaim(id) {
  if ($("#sendToEmailError2").css("display") === "block") {
    $("#sendToEmailError2").slideToggle()
  }
  let dom = document.getElementById("sendToEmailBtn2")
  setDisable([dom])
  sentEmail = firebase.functions().httpsCallable('sendClaimVerificationtoEmail')
  sentEmail({claim_id: id }).then(data => {
    $("#sendToEmailError2").removeClass("error")
    if ($("#sendToEmailError2").css("display") === "none") {
      $("#sendToEmailError2").text("Email successfully sent")
      $("#sendToEmailError2").slideToggle()
    }
  }).catch(err => {
    $("#sendToEmailError2").addClass("error")
    if ($("#sendToEmailError2").css("display") === "none") {
      $("#sendToEmailError2").text("Unknow error occured.")
      $("#sendToEmailError2").slideToggle()
    }
  }).then(() => {
    setEnable([dom])
  })
}

function showWhatNext() {
  $(".dialog-whats-next").addClass("show-dialog")
  localStorage[userData.uid+"seen_whats_next"] = true
}
