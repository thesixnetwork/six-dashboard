// Log out function using in Wizardd page to sign current user out
function logOut () {
  console.log('logout')
  firebase.auth().signOut()
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

let intervalFunction
let userData
let pic1Url
let pic2Url
let pic3Url
let pic4Url

function submitPhoneNumber() {
  if ($("#verifyPhoneError").css("display", "block")) {
    $("#verifyPhoneError").slideToggle()
  }
  if ($("#verifyPhoneSubmitError").css("display", "block")) {
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
  let currentUser = firebase.auth().currentUser
  let db = firebase.firestore().collection('users').doc(currentUser.uid)
  db.update({phone_number: phone_number, phone_verified: true}).then(() => {
    document.getElementById("kycCountry").value = countryPhone
    goToKYCStep()
    setEnable([phoneNumberDOM, btnDOM, countryPhoneDOM])
  }).catch(() => {
    $("#verifyPhoneError").html("Unexpected error, please try again")
    if ($("#verifyPhoneError").css("display", "none")) {
      $("#verifyPhoneError").slideToggle()
    }
    setEnable([phoneNumberDOM, btnDOM, countryPhoneDOM])
  })
/*
  let requestFunction = firebase.functions().httpsCallable('phoneVerificationRequest')
  requestFunction({phone_number: phone_number}).then(response => {
    if (response.data.success === true) {
      $('#verifyCodeContent1').removeClass('show-detail')
      $('#verifyCodeContent2').addClass('show-detail')
      $('#refVerify').html(response.data.ref_code)
      $('#refPhoneNumber').html(phone_number)
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
*/
}

function kycCountryChange() {
  let countryDOM = document.getElementById("kycCountry")
  const country = countryDOM.value
  if (country === "TH") {
    $("#citizenId").css("display", "block")
    $("#citizenIdPhoto").css("display", "block")
  } else {
    $("#citizenId").css("display", "none")
    $("#citizenIdPhoto").css("display", "none")
  }
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
      document.getElementById("kycCountry").value = countryPhone
      goToKYCStep()
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

function goToVerifyPhoneStep() {
  $('#verifyEmailContent').removeClass('show-detail')
  $('#verifyPhoneStep').addClass('current')
  $('#verifyPhoneContent').addClass('show-detail')
}

function goToKYCStep() {
  $('#verifyEmailContent').removeClass('show-detail')
  $('#verifyPhoneContent').removeClass('show-detail')
  $('#verifyPhoneStep').addClass('current')
  $('#kycStep').addClass('current')
  $('#kycContent').addClass('show-detail')
}

function goToFinishStep() {
  $('#verifyEmailContent').removeClass('show-detail')
  $('#verifyPhoneContent').removeClass('show-detail')
  $('#kycContent').removeClass('show-detail')
  $('#verifyPhoneStep').addClass('current')
  $('#kycStep').addClass('current')
  $('#doneStep').addClass('current')
  $('#congratulationPage').addClass('show-detail')
}

function goToICOStep() {
  $('#verifyEmailContent').removeClass('show-detail')
  $('#verifyPhoneContent').removeClass('show-detail')
  $('#kycContent').removeClass('show-detail')
  $('#congratulationPage').removeClass('show-detail')
  $('#verifyPhoneStep').addClass('current')
  $('#kycStep').addClass('current')
  $('#doneStep').addClass('current')
  $('#icoStep').addClass('current')
  $('#icoPage').addClass('show-detail')
}

function resendVerifyEmailClick() {
  let resendDOM = document.getElementById('verifyResendBtn')
  setDisable([resendDOM])
  if ($("#verifyNotice").css("display") == "block") {
    $("#verifyNotice").slideToggle(400, resendVerifyEmail)
  } else {
    resendVerifyEmail()
  }
}

function resendVerifyEmail() {
  let promise = new Promise(function (resolve, reject) {
    let resendDOM = document.getElementById('verifyResendBtn')
    let currentUser = firebase.auth().currentUser
    currentUser.sendEmailVerification().then(() => { 
      if ($("#verifyNotice").css("display") == "none") {
        $("#verifyNotice").html("Email successfully sent to your inbox.")
        setEnable([resendDOM])
        $("#verifyNotice").slideToggle(400, resolve)
      }
    }).catch((err) => {
      if ($("#verifyNotice").css("display") == "none") {
        $("#verifyNotice").html(err.message)
        setEnable([resendDOM])
        $("#verifyNotice").slideToggle(400, resolve)
      }
    })
  })
  return promise
}

function setupUserData() {
  if (userData.phone_number !== undefined) {
    document.getElementById("verifyPhonePhonenumber").value = userData.phone_number
  }
  if (userData.first_name !== undefined) {
    document.getElementById("kycFirstName").value = userData.first_name
  }
  if (userData.last_name !== undefined) {
    document.getElementById("kycLastName").value = userData.last_name
  }
  if (userData.country !== undefined) {
    document.getElementById('kycCountryPhone').value = userData.country
    document.getElementById("kycCountry").value = userData.country
    kycCountryChange()
  }
  if (userData.citizen_id !== undefined) {
    document.getElementById("kycCitizenId").value = userData.citizen_id
  }
  if (userData.passport_number !== undefined) {
    document.getElementById("kycPassportNumber").value = userData.passport_number
  }
  if (userData.address !== undefined) {
    document.getElementById("kycAddress").value = userData.address
  }
  if (userData.estimate !== undefined) {
    document.getElementById("kycEstimate").value = userData.estimate
  }
  if (userData.is_presale === true) {
    $("#presale_congrat").css('display', 'block')
    $("#normal_congrat").css('display', 'none')
  } else {
    $("#presale_congrat").css('display', 'none')
    $("#normal_congrat").css('display', 'block')
  }
  pic1Url = userData.pic1
  pic2Url = userData.pic2
  pic3Url = userData.pic3
  pic4Url = userData.pic4
  if (pic1Url !== undefined) {
    $("#sampleImage1").attr("src", pic1Url)
    $("#sampleImage1").toggle()
  }
  if (pic2Url !== undefined) {
    $("#sampleImage2").attr("src", pic2Url)
    $("#sampleImage2").toggle()
  }
  if (pic3Url !== undefined) {
    $("#sampleImage3").attr("src", pic3Url)
    $("#sampleImage3").toggle()
  }
  if (pic4Url !== undefined) {
    $("#sampleImage4").attr("src", pic4Url)
    $("#sampleImage4").toggle()
  }
  if (userData.kyc_status === 'rejected') {
    $("#rejectReason").html(String(userData.reject_note).split("\n").join("<br>"))
    if (userData.reject_note_extend !== null && userData.reject_note_extend !== '' && userData.reject_note_extend !== undefined) {
      $("#rejectReasonExtend").html(String(userData.reject_note_extend))
      $("#extendRejectNote").css("display", "block")
    }
  }
  if (userData.is_restricted === true) {
    $("#resubmission").css("display", "none")
  }
}

// Steps
function initializeStep() {
  let promise = new Promise(function (resolve, reject) {
    let currentUser = firebase.auth().currentUser
    if (currentUser.emailVerified == true) {
      goToVerifyPhoneStep()
      let db = firebase.firestore()
      db.collection('users').doc(firebase.auth().currentUser.uid).get().then(doc => {
        userData = doc.data()
        setupUserData()
        if (doc.data().phone_verified === true) {
          goToKYCStep()
          if (userData.kyc_status === 'pending') {
            $("#kycContentForm").removeClass("show-detail")
            $("#kycContentPending").addClass("show-detail")
            resolve()
          } else if (userData.kyc_status === 'rejected') {
            $("#kycContentForm").removeClass("show-detail")
            $("#kycContentRejected").addClass("show-detail")
            resolve()
          } else if (userData.kyc_status === 'approved') {
            goToFinishStep()
            if (userData.all_done === true) {
              goToICOStep()
              resolve()
            } else {
              resolve()
            }
          } else {
            resolve()
          }
        } else {
          resolve()
        }
      }).catch(() => {
        resolve()
      })
    } else {
      $("#emailToVerify").html(currentUser.email)
      resolve()
    }
  })
  return promise
}

function resubmission() {
  $("#kycContentForm").addClass("show-detail")
  $("#kycContentRejected").removeClass("show-detail")
  let uid = firebase.auth().currentUser.uid
  firebase.firestore().collection('users').doc(uid).update({
    kyc_status: null,
    reject_note_extend: null,
  })
  $("#extendRejectNote").css("display", "none")
}

function proceedToIco() {
  $("#icoPage").addClass("show-detail")
  $('#icoStep').addClass('current')
  $("#congratulationPage").removeClass("show-detail")
  let uid = firebase.auth().currentUser.uid
  firebase.firestore().collection('users').doc(uid).update({
    all_done: true
  })
}

function submitKyc() {
  $(".kycinput").removeClass('invalid')
  let btnDOM = document.getElementById('kycSubmitBtn')
  let firstNameDOM = document.getElementById('kycFirstName')
  let lastNameDOM = document.getElementById('kycLastName')
  let countryDOM = document.getElementById('kycCountry')
  let citizenIdDOM = document.getElementById('kycCitizenId')
  let passportNumberDOM = document.getElementById('kycPassportNumber')
  let addressDOM = document.getElementById('kycAddress')
  let pic1DOM = document.getElementById('kycPic1')
  let pic2DOM = document.getElementById('kycPic2')
  let pic3DOM = document.getElementById('kycPic3')
  let pic4DOM = document.getElementById('kycPic4')
  let estimateDOM = document.getElementById('kycEstimate')
  setDisable([btnDOM, firstNameDOM, lastNameDOM, countryDOM, citizenIdDOM, passportNumberDOM, addressDOM, pic1DOM, pic2DOM, pic3DOM, pic4DOM, estimateDOM])
  const first_name = firstNameDOM.value
  const last_name = lastNameDOM.value
  const country = countryDOM.value
  const citizen_id = citizenIdDOM.value
  const passport_number = passportNumberDOM.value
  const address = addressDOM.value
  const pic1 = pic1DOM.files[0]
  const pic2 = pic2DOM.files[0]
  const pic3 = pic3DOM.files[0]
  const pic4 = pic4DOM.files[0]
  const estimate = estimateDOM.value
  let validate = true
  if (first_name == '' || first_name == undefined) { $('#kycFirstNameAlert').addClass('invalid'); validate = false }
  if (/^[a-zA-Z ]+$/.test(first_name) === false) {
    $('#kycFirstNameAlert').addClass('invalid')
    validate = false
    $("#kycFirstNameError").html('Firstname should contain only alphabetic characters')
    $("#kycFirstNameError").css('display', 'block')
  }
  if (last_name == '' || last_name == undefined) { $('#kycLastNameAlert').addClass('invalid'); validate = false }
  if (/^[a-zA-Z ]+$/.test(last_name) === false) {
    $('#kycLastNameAlert').addClass('invalid')
    validate = false
    $("#kycLastNameError").html('Lastname should contain only alphabetic characters')
    $("#kycLastNameError").css('display', 'block')
  }
  if (country == '' || country == undefined) { $('#kycCountryAlert').addClass('invalid'); validate = false }
  if ((citizen_id == '' || citizen_id == undefined) && country === 'TH') { $('#kycCitizenIdAlert').addClass('invalid'); validate = false }
  if (/^[a-zA-Z0-9 ]+$/.test(citizen_id) === false && country === 'TH') {
    $('#kycCitizenIdAlert').addClass('invalid')
    validate = false
    $("#kycCitizenIdError").html('Citizen ID should contain only alphabetic characters and digits')
    $("#kycCitizenIdError").css('display', 'block')
  }
  if (passport_number == '' || passport_number == undefined) { $('#kycPassportNumberAlert').addClass('invalid'); validate = false }
  if (/^[a-zA-Z0-9 ]+$/.test(passport_number) === false) {
    $('#kycPassportNumberAlert').addClass('invalid')
    validate = false
    $("#kycPassportNumberError").html('Citizen ID should contain only alphabetic characters and digits')
    $("#kycPassportNumberError").css('display', 'block')
  }
  if (address == '' || address == undefined) { $('#kycAddressAlert').addClass('invalid'); validate = false }
  if (/^[a-zA-Z0-9!”$%&’()*\+, \/;\[\\\]\^_`{|}~]+$/.test(address) === false) {
    $('#kycAddressAlert').addClass('invalid')
    validate = false
    $("#kycAddressError").html('Address should contain only alphabetic characters, digits, and special characters')
    $("#kycAddressError").css('display', 'block')
  }
  if ((pic1 == '' || pic1 == undefined) && pic1Url === undefined && country === 'TH') { $('#kycPic1Alert').addClass('invalid'); validate = false }
  if ((pic2 == '' || pic2 == undefined) && pic2Url === undefined) { $('#kycPic2Alert').addClass('invalid'); validate = false }
  if ((pic3 == '' || pic3 == undefined) && pic3Url === undefined) { $('#kycPic3Alert').addClass('invalid'); validate = false }
  if ((pic4 == '' || pic4 == undefined) && pic4Url === undefined) { $('#kycPic4Alert').addClass('invalid'); validate = false }
  if (estimate == '' || estimate == undefined) { $('#kycEstimateAlert').addClass('invalid'); validate = false }
  if (/^[0-9\.]+$/.test(estimate) === false) {
    $('#kycEstimateAlert').addClass('invalid')
    validate = false
    $("#kycEstimateError").html('Contribution amount should contain only digits and period')
    $("#kycEstimateError").css('display', 'block')
  }
  if (parseFloat(estimate) < 0.2) {
    $('#kycEstimateAlert').addClass('invalid')
    validate = false
    $("#kycEstimateError").html('Contribution amount must be at least 0.2 ETH to get the minimum of SIX token')
    $("#kycEstimateError").css('display', 'block')
  }
  if (validate === false) {
    setEnable([btnDOM, firstNameDOM, lastNameDOM, countryDOM, citizenIdDOM, passportNumberDOM, addressDOM, pic1DOM, pic2DOM, pic3DOM, pic4DOM, estimateDOM])
  } else {
    let uid = firebase.auth().currentUser.uid
    let dataToUpdate = {
      first_name: first_name,
      last_name: last_name,
      country: country,
      passport_number: passport_number,
      address: address,
      pic2: pic2Url,
      pic3: pic3Url,
      pic4: pic4Url,
      estimate: estimate,
      kyc_status: 'pending',
      kyc_submit_time: Math.round((new Date()).getTime() / 1000)
    }
    if (country === 'TH') {
      dataToUpdate.pic1 = pic1Url
      dataToUpdate.citizen_id = citizen_id
    }
    firebase.firestore().collection('users').doc(uid).update(dataToUpdate).then(() => {
      $("#kycContentForm").removeClass("show-detail")
      $("#kycContentPending").addClass("show-detail")
      setEnable([btnDOM, firstNameDOM, lastNameDOM, countryDOM, citizenIdDOM, passportNumberDOM, addressDOM, pic1DOM, pic2DOM, pic3DOM, pic4DOM, estimateDOM])
    }).catch(err => {
      console.log(err.message)
      setEnable([btnDOM, firstNameDOM, lastNameDOM, countryDOM, citizenIdDOM, passportNumberDOM, addressDOM, pic1DOM, pic2DOM, pic3DOM, pic4DOM, estimateDOM])
    })
  }
}

function uploadFile(fileNumber, file) {
  if ($("#pgbarPic"+fileNumber).css('display') == 'none') {
    $("#pgbarPic"+fileNumber).slideToggle()
  }
  if ($("#sampleImage"+fileNumber).css('display') == 'block') {
    $("#sampleImage"+fileNumber).slideToggle(400, function() { $("#sampleImage"+fileNumber).attr("src", "") })
  }
  $("#kycPicName"+fileNumber).html(file.name)
  $("#kycPic"+fileNumber+"Alert").removeClass("invalid")
  let user = firebase.auth().currentUser
  let storageRef = firebase.storage().ref()
  let fileType
  if (fileNumber == 1) {
    fileType = 'citizen_id'
  } else if (fileNumber == 2) {
    fileType = 'holding_passport'
  } else if (fileNumber == 3) {
    fileType = 'bill'
  } else {
    fileType = 'passport_number'
  }
  var uploadTask = storageRef.child(user.uid+'/'+Math.round((new Date()).getTime() / 1000)+'/'+fileType+'/'+file.name).put(file)
  uploadTask.on('state_changed', function(snapshot){
    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    $("#pgbarCPic"+fileNumber).css('width', progress+'%')
    switch (snapshot.state) {
      case firebase.storage.TaskState.PAUSED: // or 'paused'
        break;
      case firebase.storage.TaskState.RUNNING: // or 'running'
        break;
    }
  }, function(error) {
    if ($("#pgbarPic"+fileNumber).css('display') == 'block') {
      $("#pgbarPic"+fileNumber).slideToggle(400, function() {
        $("#pgbarCPic"+fileNumber).css('width', '0%')
      })
    }
    console.log(error)
  }, function() {
    var downloadURL = uploadTask.snapshot.downloadURL;
    if (fileNumber == 1) {
      pic1Url = downloadURL
    } else if (fileNumber == 2) {
      pic2Url = downloadURL
    } else if (fileNumber == 3) {
      pic3Url = downloadURL
    } else {
      pic4Url = downloadURL
    }
    if ($("#pgbarPic"+fileNumber).css('display') == 'block') {
      setTimeout(function() {
        $("#pgbarPic"+fileNumber).slideToggle(400, function() {
          $("#pgbarCPic"+fileNumber).css('width', '0%')
        })
      }, 500);
    }
    $("#sampleImage"+fileNumber).attr("src", downloadURL)
    if ($("#sampleImage"+fileNumber).css('display') == 'none') {
      $("#sampleImage"+fileNumber).slideToggle()
    }
  });
}

$(document).ready(function () {
  document.getElementById('kycFirstName').onkeydown = function() {
    $('#kycFirstNameAlert').removeClass("invalid")
    $("#kycFirstNameError").html('')
    $("#kycFirstNameError").css('display', 'none')
  }
  document.getElementById('kycLastName').onkeydown = function() { 
    $('#kycLastNameAlert').removeClass("invalid")
    $("#kycLastNameError").html('')
    $("#kycLastNameError").css('display', 'none')
  }
  document.getElementById('kycCitizenId').onkeydown = function() {
    $('#kycCitizenIdAlert').removeClass("invalid")
    $("#kycCitizenIdError").html('')
    $("#kycCitizenIdError").css('display', 'none')
  }
  document.getElementById('kycPassportNumber').onkeydown = function() {
    $('#kycPassportNumberAlert').removeClass("invalid")
    $("#kycPassportError").html('')
    $("#kycPassportError").css('display', 'none')
  }
  document.getElementById('kycAddress').onkeydown = function() {
    $('#kycAddressAlert').removeClass("invalid")
    $("#kycAddressError").html('')
    $("#kycAddressError").css('display', 'none')
  }
  document.getElementById('kycEstimate').onkeydown = function() {
    $('#kycEstimateAlert').removeClass("invalid")
    $("#kycEstimateError").html('')
    $("#kycEstimateError").css('display', 'none')
  }
  $('#kycPic1').change(function () {
    uploadFile(1, this.files[0])
  })
  $('#kycPic2').change(function () {
    uploadFile(2, this.files[0])
  })
  $('#kycPic3').change(function () {
    uploadFile(3, this.files[0])
  })
  $('#kycPic4').change(function () {
    uploadFile(4, this.files[0])
  })
  // ===================== //
  // ===== Countdown ===== //
  // ===================== //
  var countDownDate = new Date('April 3, 2018 10:00:00').getTime()
  var now = new Date().getTime()
  var distance = countDownDate - now

  function flipTo (digit, n) {
    var current = digit.attr('data-num')
    digit.attr('data-num', n)
    digit.find('.front').attr('data-content', current)
    digit.find('.back, .under').attr('data-content', n)
    digit.find('.flap').css('display', 'block')
    setTimeout(function () {
      digit.find('.base').text(n)
      digit.find('.flap').css('display', 'none')
    }, 350)
  }

  var getTime = function () {
    var time = []

    now = new Date().getTime()
    distance = countDownDate - now

    var days = Math.floor(distance / (1000 * 60 * 60 * 24))
    var hrs = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    var mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    var secs = Math.floor((distance % (1000 * 60)) / 1000)

    if (days < 10) {
      days = '0' + days
    }
    if (hrs < 10) {
      hrs = '0' + hrs
    }
    if (mins < 10) {
      mins = '0' + mins
    }
    if (secs < 10) {
      secs = '0' + secs
    }

    time = {'days': days, 'hrs': hrs, 'mins': mins, 'secs': secs}

    return time
  }

  // Coundown
  var countdown = function () {
    var countTime = getTime()

    if (countTime['hrs'] == 24) {
      flipTo($('ul.countdown li.days .digit'), countTime['days'])
    }
    if (countTime['mins'] == 59) {
      flipTo($('ul.countdown li.hrs .digit'), countTime['hrs'])
    }
    if (countTime['secs'] == 59) {
      flipTo($('ul.countdown li.mins .digit'), countTime['mins'])
    }

    flipTo($('ul.countdown li.secs .digit'), countTime['secs'])

    // If the count down is over, write some text
    if (distance < 0) {
      clearInterval(x)
      $('ul.countdown').remove()
    }
  }

  // Update Time
  var x = setInterval(function () {
    countdown()
  }, 1000)

  // Set First Time
  var firstTime = getTime()
  flipTo($('ul.countdown li.days .digit'), firstTime['days'])
  flipTo($('ul.countdown li.hrs .digit'), firstTime['hrs'])
  flipTo($('ul.countdown li.mins .digit'), firstTime['mins'])
  flipTo($('ul.countdown li.secs .digit'), firstTime['secs'])
  // ===================== //
  // ===================== //

  // Listening to auth state change
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      console.log('Go to login')
      window.location.href = '/'
    } else {
      initializeAdmin().then(() => {
        $('#adminShortcut').css('display', 'block')
      }).finally(() => {
        initializeStep().then(() => {
          
        }).finally(() => {
          $('#preLoader').fadeToggle()
        })
      })
    }
  })
})
