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

var intervalFunction
var phoneNumber
var redeemCode
var email

function submitRedeem() {
  if ($("#redeemError").css("display") === 'block') {
    $("#redeemError").slideToggle()
  }
  let dom1 = document.getElementById('redeemCode')
  let dom2 = document.getElementById('email')
  let dom3 = document.getElementById('submit')
  setDisable([dom1, dom2, dom3])
  let requestFunction = firebase.functions().httpsCallable('submitRedeemCode')
  requestFunction({redeem_code: dom1.value, email: dom2.value}).then(response => {
    redeemCode = dom1.value
    email = dom2.value
    if (response.data.success === true) {
      if (response.data.type === 0) {
        $("#redeemContainer1").fadeToggle(100, () => {
          $("#redeemContainer3").fadeToggle(100)
        })
      } else {
        $('#refVerify').html(response.data.ref_code)
        $('#refPhoneNumber').html(response.data.phone_number)

        phoneNumber = response.data.phone_number

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
              $("#redeemContainer2").fadeToggle(100, () => {
                $("#redeemContainer1").fadeToggle(100)
              })
            }
          }
          appendText()
          intervalFunction = setInterval(() => { count() }, 1000)
        }
        let countDownNum = response.data.valid_until - Math.round((new Date()).getTime() / 1000)
        countdown({ fromNumber: countDownNum })

        $("#redeemContainer1").fadeToggle(100, () => {
          $("#redeemContainer2").fadeToggle(100, () => {
            setEnable([dom1, dom2, dom3])
          })
        })
      }
    } else {
      if ($("#redeemError").css("display") === 'none') {
        $("#redeemError").text(response.data.message)
        $("#redeemError").slideToggle()
      }
      setEnable([dom1, dom2, dom3])
    }
  })
}

function submitPhoneNumberCode() {
  if ($("#verifyPhoneSubmitError").css("display") === "block") {
    $("#verifyPhoneSubmitError").slideToggle()
  }
  let codeDOM = document.getElementById('verifyCode')
  let btnDOM = document.getElementById('verifyPhoneSubmitBtn')
  const code = codeDOM.value
  setDisable([codeDOM, btnDOM])
  let requestFunction = firebase.functions().httpsCallable('phoneVerificationSubmit')
  requestFunction({phone_number: phoneNumber, ref_code: $('#refVerify').html(), code: code}).then(response => {
    if (response.data.success === true) {
      $("#redeemContainer2").fadeToggle(100, () => {
        $("#redeemContainer3").fadeToggle()
      })
    } else {
      $("#verifyPhoneSubmitError").html(response.data.error_message)
      if ($("#verifyPhoneSubmitError").css("display", "none")) {
        $("#verifyPhoneSubmitError").slideToggle()
      }
    }
    setEnable([codeDOM, btnDOM])
  })
}

function setNewPassword() {
  if ($("#passwordError").css("display") === 'block') {
    $("#passwordError").slideToggle()
  }
  let dom1 = document.getElementById("password")
  let dom2 = document.getElementById("passwordConfirmation")
  let dom3 = document.getElementById("submitPassword")
  if (dom1.value !== dom2.value) {
    if ($("#passwordError").css("display") === 'none') {
      $("#passwordError").text("Password is not match")
      $("#passwordError").slideToggle()
    }
  }
  let password = dom1.value
  setDisable([dom1, dom2, dom3])
  let requestFunction = firebase.functions().httpsCallable('changeRedeemPassword')
  requestFunction({redeem_code: redeemCode, email: email, password: password}).then(response => {
    firebase.auth().signInWithEmailAndPassword(email, password).then(() => {

    }).catch(() => { 
      setEnable([dom1, dom2, dom3])
    })
  }).catch(() => {
    setEnable([dom1, dom2, dom3])
  })
}

$(document).ready(function () {
  $('#submit').click(function(e) {
    e.preventDefault();
    submitRedeem()
  })
  $('#verifyPhoneSubmitBtn').click(function(e) {
    e.preventDefault();
    submitPhoneNumberCode()
  })
  $('#submitPassword').click(function(e) {
    e.preventDefault();
    setNewPassword()
  })
  $('body').on('click', '.dropdown a', function() {
    var dropdown = $(this).parent(".dropdown");
    dropdown.toggleClass("show-dropdown");
    clickBody('dropdown', dropdown, 'show-dropdown');
  });

  firebase.auth().onAuthStateChanged(function (user) {
    if (user && user.uid) {
      window.location.href = 'dashboard'+window.location.search
    }
  })
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

