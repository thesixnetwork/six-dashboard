// Log out function using in Wizardd page to sign current user out
function logOut () {
  console.log('logout')
  firebase.auth().signOut()
}

// Set disbled to dom
function setDisable (doms) {
  doms.forEach(function (dom) {
    dom.disabled = true
  })
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
  const ethAddress = ethAddressDOM.value
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
  const ethAddress = ethAddressDOM.value
  if (ethAddress === undefined || ethAddress === null || ethAddress === '') {
    $("#ethWalletAddressAlert").addClass("invalid")
    $("#ethWalletAddressAlertText").html("ETH Address could not be blank")
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
        $("#myETHWalletAddress").val(ethAddress)
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
    $(".xlmPrice").html("1 SIX = "+data.price.price+" USD")
    xlmPrice = data.price
    const elem = document.getElementById('xlmToSixInput')
    setEnable([elem])
  })
}

function updateETHprice() {
  latestETHprice().then(data => {
    $(".ethPrice").html("1 SIX = "+data.price.price+" USD")
    ethPrice = data.price
    const elem = document.getElementById('ethToSixInput')
    setEnable([elem])
  })
}

function updatePrice() {
  updateXLMprice()
  updateETHprice()
}

// count six amount
function sumSixAmountToUser () {
  firebase.firestore().collection('purchase_txs').where("user_id",'==',firebase.auth().currentUser.uid).get()
    .then(snapshot => {
      let sixAmount = 0
      snapshot.forEach(doc => {
        sixAmount = sixAmount + doc.data().six_amount
      })
      $('#totalSix').html(`${sixAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} `)
    })
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

function getCurrentTotal() {
  return firebase.firestore().collection('total_asset').doc('usd').get().then(doc => {
    const currentAsset = doc.data().total
    const percentage = ((currentAsset/(doc.data().hard_cap_usd/100)) || 0)
    $("#totalCurrentAsset").html(parseFloat(currentAsset).toLocaleString())
    $("#barPercentage").css("width", Number(percentage.toFixed(1))+"%")
  })
}

function submitDepositXLMTran() {
  const btnDOM = document.getElementById("submitDepositXLMTran")
  const xlmToSixInput = document.getElementById("xlmToSixInput")
  const xlm_value = (parseFloat(xlmToSixInput.value) || 0)
  setDisable([btnDOM])
  updateUser({first_transaction: true, alloc_transaction: true, alloc_transaction_type: 'XLM', alloc_transaction_amount: xlm_value, alloc_time: Math.round((new Date()).getTime() / 1000)}).then(() => {
    setEnable([btnDOM])
    $("#questionBox").css("display", "none")
    $("#submitXLMBox").css("display", "none")
    $("#submitETHBox").css("display", "none")
    $("#depositETHBox").css("display", "none")
    $("#depositXLMBox").css("display", "none")
    $("#mainBox").css("display", "none")
    if (userData.seen_congrat === true) {
      const thisTime = (new Date()).getTime()
      let amount = 0
      if (userData.is_presale === true) {
        amount = Number((xlm_value*xlmPrice.six_per_xlm).toFixed(7))
      } else {
        amount = Number((xlm_value*xlmPrice.six_per_xlm).toFixed(7))*1.06
      }
      const elem = buildListTx({ time: thisTime, native_amount: xlm_value, type: "XLM", to: '-', id: '-', time: thisTime, six_amount: amount.toLocaleString(), tx_status: 'pending' })
      $("#userTxs")[0].prepend(elem)
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
  updateUser({first_transaction: true, alloc_transaction: true, alloc_transaction_type: 'ETH', alloc_transaction_amount: eth_value, alloc_time: Math.round((new Date()).getTime() / 1000)}).then(() => {
    setEnable([btnDOM])
    $("#questionBox").css("display", "none")
    $("#submitXLMBox").css("display", "none")
    $("#submitETHBox").css("display", "none")
    $("#depositETHBox").css("display", "none")
    $("#depositXLMBox").css("display", "none")
    $("#mainBox").css("display", "none")
    if (userData.seen_congrat === true) {
      const thisTime = (new Date()).getTime()
      let amount = 0
      if (userData.is_presale === true) {
        amount = Number((eth_value*ethPrice.six_per_eth).toFixed(7))
      } else {
        amount = Number((eth_value*ethPrice.six_per_eth).toFixed(7))*1.06
      }
      const elem = buildListTx({ time: thisTime, native_amount: eth_value, type: "ETH", to: '-', id: '-', time: thisTime, six_amount: amount.toLocaleString(), tx_status: 'pending' })
      $("#userTxs")[0].prepend(elem)
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

function getTxs () {
  if (firebase.auth().currentUser !== null) {
    firebase.firestore().collection('purchase_txs')
    .where("user_id",'==',firebase.auth().currentUser.uid)
    .get()
    .then(snapshot => {
      $('#userTxs').empty()
      snapshot.forEach(d => {
        const data = d.data()
        const elem = buildListTx(data)
        $("#userTxs")[0].appendChild(elem)
      })
    })
  }
}

$(document).ready(function(){
  document.getElementById('walletETHinput').onkeydown = function() {
    $('#ethWalletAddressAlert').removeClass("invalid")
    $("#ethWalletAddressAlertText").html('')
    $("#ethWalletAddressAlertText").css('display', 'none')
  }

  document.getElementById('xlmToSixInput').onkeyup = function() {
    let number = parseFloat(this.value) || 0
    $("#xlmToSix").html(Number((number*xlmPrice.six_per_xlm).toFixed(7)).toLocaleString())
    $("#bonusXLM").html(Number(((number*xlmPrice.six_per_xlm)*0.06).toFixed(7)))
    $("#xlmToSixInputAlertText").html("")
    $("#xlmToSixInputAlertText").css("display", "none")
    $("#xlmToSixInputAlert").removeClass("invalid")
  }

  document.getElementById('ethToSixInput').onkeyup = function() {
    let number = parseFloat(this.value) || 0
    $("#ethToSix").html(Number((number*ethPrice.six_per_eth).toFixed(7)).toLocaleString())
    $("#bonusETH").html(Number(((number*ethPrice.six_per_eth)*0.06).toFixed(7)))
    $("#ethToSixInputAlertText").html("")
    $("#ethToSixInputAlertText").css("display", "none")
    $("#ethToSixInputAlert").removeClass("invalid")
  }

    // Dialog
    // Open
    $("body").on("click", ".open-dialog-video", function(){
        $('.dialog-video').addClass('show-dialog');
    });
    // Close
		$('body').on('click', '[class^="dialog-"] dialog', function(e){
			e.stopPropagation();
    });

    $('body').on('click', '[class^="dialog-"]', function(){
			$(this).removeClass('show-dialog');
    });

    $('body').on('click', '[class^="dialog-"] dialog a.close', function(){
			$(this).parents('[class^="dialog-"]').removeClass('show-dialog');
		});

    $('body').on('click', '[class^="dialog-"] dialog a.close', function(){
			$(this).parents('[class^="dialog-"]').removeClass('show-dialog');
		});

    function copyToClipboard (el) {
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
      }
      else {
          el.select();
      }

      // execute copy command
      success = document.execCommand('copy');
      alert(success)
  }
  // Listening to auth state change
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      console.log('Go to login')
      window.location.href = '/'
    } else {
      initializeAdmin().then(() => {
        sumSixAmountToUser()
        return $('#adminShortcut').css('display', 'block')
      }).finally(() => {
        return firebase.firestore().collection('users').doc(user.uid).get().then(doc => {
          userData = doc.data()
          let name = (userData.first_name || "") + " " + (userData.last_name || "")
          $("#displayName").html(name || "")
          $("#firstCharName").html((userData.first_name || "").substr(0,1).toUpperCase())
          $("#myMemo").html(userData.memo)
          if (userData.first_transaction === true) {
            if (userData.seen_congrat === true) {
              $("#welcomeBox").css("display", "none")
              $("#mainBox").css("display", "block")
            } else {
              $("#welcomeBox").css("display", "none")
              $("#congratulationBox").css("display", "block")
            }
          }
          if (userData.eth_address !== undefined) {
            $("#myWallet").css("display", "block")
            $("#myETHaddress")[0].value = userData.eth_address
            $("#myETHWalletAddress").val(userData.eth_address)
            var copyTextareaBtn = document.querySelector('#myETHWalletAddressButton')
            copyTextareaBtn.addEventListener('click',function(event){
              copyToClipboard('#myETHWalletAddress')
            })

          } else {
            $("#myETHaddress")[0].value = '-'
            $("#myETHWalletAddress").val('-')
          }
          if (userData.is_presale === true) {
            $("#bonusXLMText").css('display', 'block')
            $("#bonusETHText").css('display', 'block')
          }
        }).then(getCurrentTotal).then(() => {
          getTxs()
          $('#preLoader').fadeToggle()
          updatePrice()
        })
      })
    }
  })
});
