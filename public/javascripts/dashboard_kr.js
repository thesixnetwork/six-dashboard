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

function compare(a,b) {
  if (a.data().time > b.data().time)
    return -1;
  if (a.data().time < b.data().time)
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
  return firebase.firestore().collection('total_asset').doc('usd').get().then(doc => {
    const totalAsset = parseFloat(doc.data().total || 0)
    const privateAsset = parseFloat(doc.data().private_asset || 0)
    const currentAsset = privateAsset+totalAsset
    const softCapAmount = doc.data().soft_cap_usd
    const percentage = Number(((currentAsset/(doc.data().hard_cap_usd/100)) || 0).toFixed(0))
    let scalePercentage = Number((((((100-percentage)*99273.68461538461)+currentAsset)/(doc.data().hard_cap_usd/100)) || 0).toFixed(1))
    if ((scalePercentage + 5) < 100) {
      scalePercentage = scalePercentage+5
    }
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
        target.text(floored_number+' M');
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
      $("#backToTxHis").css("display", "block")
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
      $("#backToTxHis").css("display", "block")
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
  $("#backToTxHis").css("display", "block")
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
  $("#backToTxHis").css("display", "block")
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

let totalSix = 0

function getTxs () {
  if (firebase.auth().currentUser !== null) {
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
        let allDoc = []
        snapshot.forEach(d => {
          allDoc.push(d)
        })
        allDoc.sort(compare)
        var percent_number_step = $.animateNumber.numberStepFactories.append(' SIX')
        $('#totalSix').animateNumber(
          {
            number: totalSix.toFixed(7),
            numberStep: percent_number_step
          }
        );
        allDoc.forEach(d => {
          let data = d.data()
          if (preDocData[d.id] !== undefined && preDocData[d.id] !== null) {
            data.six_amount = Number((data.six_amount * 1.06).toFixed(7))
            totalSix += data.six_amount
            $('#totalSix').animateNumber(
              {
                number: totalSix.toFixed(7),
                numberStep: percent_number_step
              }
            );
          } else {
             data.six_amount = Number((data.six_amount).toFixed(7))
             totalSix += data.six_amount
             $('#totalSix').animateNumber(
               {
                 number: totalSix.toFixed(7),
                 numberStep: percent_number_step
               }
             )
          }
          const elem = buildListTx(data)
          $("#userTxs")[0].appendChild(elem)
        })
      }).catch(() => {
        $('#userTxs').empty()
        let allDoc = []
        snapshot.forEach(d => {
          allDoc.push(d)
        })
        allDoc.sort(compare)
        var percent_number_step = $.animateNumber.numberStepFactories.append(' SIX')
        $('#totalSix').animateNumber(
          {
            number: totalSix.toFixed(7),
            numberStep: percent_number_step
          }
        );
        allDoc.forEach(d => {
          const data = d.data()
          const elem = buildListTx(data)
          $("#userTxs")[0].appendChild(elem)
        })
      })
    }).then(() => {
      if (userData.alloc_transaction === true) {
        const elem = buildListTx({ time: userData.alloc_time, native_amount: userData.alloc_transaction_amount, type: userData.alloc_transaction_type, to: '-', id: '-', six_amount: userData.alloc_transaction_six_amount, alloc_time: userData.alloc_time, tx_status: 'pending' })
        $("#userTxs")[0].prepend(elem)
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

$(document).ready(function(){
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
      window.location.href = '/kr'+window.location.search
    } else {
      initializeAdmin().then(() => {
        return $('#adminShortcut').css('display', 'block')
      }).finally(() => {
        return firebase.firestore().collection('users').doc(user.uid).get().then(doc => {
          const endtime = endtimeOfIco
          if (!(Date.now() > endtime && doc.data().all_done)) {
            window.location.href = '/wizard-kr'+window.location.search
          }
          userData = doc.data()
          let name = (userData.first_name || "") + " " + (userData.last_name || "")
          $("#displayName").html(name || "")
          $("#firstCharName").html((userData.first_name || "").substr(0,1).toUpperCase())
          $(".myMemo").html(userData.memo)
          $("#memoCopy").attr('data-clipboard-text', userData.memo)
          if (userData.first_transaction === true) {
            if (userData.seen_congrat === true) {
              $("#backToTxHis").css("display", "block")
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
            $("#myETHWalletAddress").html(userData.eth_address)
            $("#myETHWalletAddress").attr('data-clipboard-text', userData.eth_address)
            $("#myAddressBtn").attr('data-clipboard-text', userData.eth_address)

          } else {
            $("#myETHaddress")[0].value = '-'
            $("#myETHWalletAddress").html('-')
            $("#myETHWalletAddress").attr('data-clipboard-text', '-')
            $("#myAddressBtn").attr('data-clipboard-text', '-')
          }
        }).then(getCurrentTotal).then(() => {
          getTxs()
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
