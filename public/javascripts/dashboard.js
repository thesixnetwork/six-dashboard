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

function submitConfirm() {
  let requestFunction = firebase.functions().httpsCallable('updateETHWallet')
  const ethAddressDOM = document.getElementById('walletETHinput')
  const btnDOM = document.getElementById('alertConfirmBtn')
  const ethAddress = ethAddressDOM.value
  setDisable([btnDOM])
  requestFunction({eth_address: ethAddress}).then(response => {
    if (response.data.success === true) {
      setEnable([btnDOM])
      $("#mainBox").css("display", "block")
      $("#walletBox").css("display", "none")
      $("#warnBox").css("display", "none")
      cancelConfirm()
    } else {
      $("#submitWalletAlertText").html(response.data.error_message)
      if ($("#submitWalletAlert").css("display") === 'none') {
        $("#submitWalletAlert").slideToggle()
      }
      setEnable([btnDOM])
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
  const ethAddress = ethAddressDOM.value
  if (ethAddress === undefined || ethAddress === null || ethAddress === '') {
    $("#ethWalletAddressAlert").addClass("invalid")
    $("#ethWalletAddressAlertText").html("ETH Address could not be blank")
    $("#ethWalletAddressAlertText").css("display", "block")
  } else {
    $("#confirmETHAddress").html(ethAddress)
    if ($("#alertModal").css("display") === 'none') {
      $("#alertModal").fadeToggle()
    }
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
    $("#xlmPrice").html("1 / "+data.price.price)
    xlmPrice = data.price
    const elem = document.getElementById('xlmToSixInput')
    setEnable([elem])
  })
}

function updateETHprice() {
  latestETHprice().then(data => {
    $("#ethPrice").html("1 / "+data.price.price)
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

function getCurrentTotal() {
  return firebase.firestore().collection('total_asset').doc('usd').get().then(doc => {
    const currentAsset = doc.data().total
    const percentage = ((currentAsset/(doc.data().hard_cap_usd/100)) || 0)
    $("#totalCurrentAsset").html(parseFloat(currentAsset).toLocaleString())
    $("#barPercentage").css("width", Number(percentage.toFixed(1))+"%")
  })
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
  }

  document.getElementById('ethToSixInput').onkeyup = function() {
    let number = parseFloat(this.value) || 0
    $("#ethToSix").html(Number((number*ethPrice.six_per_eth).toFixed(7)).toLocaleString())
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
  // Listening to auth state change
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      console.log('Go to login')
      window.location.href = '/'
    } else {
      initializeAdmin().then(() => {
        return $('#adminShortcut').css('display', 'block')
      }).finally(() => {
        return firebase.firestore().collection('users').doc(user.uid).get().then(doc => {
          let userData = doc.data()
          let name = (userData.first_name || "") + " " + (userData.last_name || "")
          $("#displayName").html(name || "")
          $("#firstCharName").html((userData.first_name || "").substr(0,1).toUpperCase())
          if (doc.data().submit_wallet === true) {
            $("#mainBox").css("display", "block")
            $("#walletBox").css("display", "none")
            $("#warnBox").css("display", "none")
            $("#xlmMemo").html(doc.data().memo)
          }
        }).then(getCurrentTotal).then(() => {
          $('#preLoader').fadeToggle()
          updatePrice()
        })
      })
    }
  })
});
