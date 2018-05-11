let rejectNote = {
  need_more: `感谢您的注册。但我们收到的关于您的KYC/ AML文件和/或信息的不完整。

我们将非常感激如果您能通过下面的链接重新提交文件和/或信息。

感谢您对我们公开销售的关注。

SIX.network`,
  restricted: `感谢您的注册。在审核完您提交的申请材料后，您的KYC/AML结果与我们的要求不符。

感谢您对我们公开销售的关注。希望您会继续在二级市场支持我们。

感谢您对SIX.network和我们公开销售的关注。

SIX.network`,
  incorrect: `感谢您的注册。但我们收到的关于您的KYC/ AML文件和/或信息的不完整。

我们将非常感激如果您能通过下面的链接重新提交文件和/或信息。

感谢您对我们公开销售的关注。

SIX.network`,
  photo_corrupted: `感谢您的注册。但我们收到的您自拍照片的信息不正确或不清楚。

我们将非常感激如果您能通过下面的链接重新提交您的自拍照片。`,
  other: `感谢您的注册。但我们收到的关于您的KYC/ AML文件和/或信息的不完整。

感谢您对我们公开销售的关注。 `
}
// Log out function using in Wizardd page to sign current user out
function logOut () {
  console.log('logout')
  firebase.auth().signOut()
}

function closeSample() {
  if ($("#sampleFader").css('display') !== 'none') {
    $("#sampleFader").fadeToggle()
  }
}

function showSample1() {
  if ($("#sampleFader").css('display') === 'none') {
    $('#sample1').css('display', 'block')
    $('#sample2').css('display', 'none')
    $('#sample3').css('display', 'none')
    $('#sample5').css('display', 'none')
    $('#sample6').css('display', 'none')
    $("#sampleFader").fadeToggle()
  }
}

function showSample2() {
  if ($("#sampleFader").css('display') === 'none') {
    $('#sample1').css('display', 'none')
    $('#sample2').css('display', 'block')
    $('#sample3').css('display', 'none')
    $('#sample5').css('display', 'none')
    $('#sample6').css('display', 'none')
    $("#sampleFader").fadeToggle()
  }
}

function showSample3() {
  if ($("#sampleFader").css('display') === 'none') {
    $('#sample1').css('display', 'none')
    $('#sample2').css('display', 'none')
    $('#sample3').css('display', 'block')
    $('#sample5').css('display', 'none')
    $('#sample6').css('display', 'none')
    $("#sampleFader").fadeToggle()
  }
}

function showSample5() {
  if ($("#sampleFader").css('display') === 'none') {
    $('#sample1').css('display', 'none')
    $('#sample2').css('display', 'none')
    $('#sample3').css('display', 'none')
    $('#sample5').css('display', 'block')
    $('#sample6').css('display', 'none')
    $("#sampleFader").fadeToggle()
  }
}

function showSample6() {
  if ($("#sampleFader").css('display') === 'none') {
    $('#sample1').css('display', 'none')
    $('#sample2').css('display', 'none')
    $('#sample3').css('display', 'none')
    $('#sample5').css('display', 'none')
    $('#sample6').css('display', 'block')
    $("#sampleFader").fadeToggle()
  }
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

// Update User
function updateUser (data) {
  var updateUserOncall = firebase.functions().httpsCallable('updateUser')
  return updateUserOncall(data)
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
let pic4Url
let pic5Url

function currencyChange() {
  let estimateCurrencyDOM = document.getElementById("kycCurrency")
  $("#kycEstimateAlert").removeClass('invalid')
  const estimate_currency = estimateCurrencyDOM.value
  if (estimate_currency === "ETH") {
    $("#estimateDescription").html("请填写您在以太坊的期望投资额，您至少要填写0.2ETH以获得最小数目的SIX代币")
  } else if (estimate_currency === "XLM") {
    $("#estimateDescription").html("请填写您在以太坊的期望投资额，您至少要填写410XLM以获得最小数目的SIX代币")
  }
}

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
    $("#verifyPhoneError").html("手机号码格式无效")
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
      if (response.data.error_code == 100) {
        $("#verifyPhoneError").html('手机号码已被使用')
      } else {
        $("#verifyPhoneError").html(response.data.error_message)
      }
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

function kycCountryChange() {
  let countryDOM = document.getElementById("kycCountry")
  const country = countryDOM.value
  if (country === "TH") {
    $("#citizenId").css("display", "block")
    $("#citizenIdPhoto").css("display", "block")
    $("#citizenIdPhotoBack").css("display", "block")
    $("#passportNumberPhoto").css("display", "none")
    $("#passportNumber").css("display", "none")
    $("#itemHoldingHead").html("")
    $("#itemHolding").html("")
    $("#samplePassportSelfie").css('display', 'none')
    $("#sampleIDSelfie").css('display', 'block')
    $("#idHelper").css('display', 'inline-block')
    $("#passportHelper").css('display', 'none')
  } else {
    $("#citizenId").css("display", "none")
    $("#citizenIdPhoto").css("display", "none")
    $("#citizenIdPhotoBack").css("display", "none")
    $("#passportNumberPhoto").css("display", "block")
    $("#passportNumber").css("display", "block")
    $("#itemHoldingHead").html("")
    $("#itemHolding").html("")
    $("#samplePassportSelfie").css('display', 'block')
    $("#sampleIDSelfie").css('display', 'none')
    $("#idHelper").css('display', 'none')
    $("#passportHelper").css('display', 'inline-block')
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
      if(response.data.error_code == 100) {
        $("#verifyPhoneSubmitError").html('手机号码已被使用')
      } else if (response.data.error_code == 200) {
        $("#verifyPhoneSubmitError").html('验证码无效')
      } else {
        $("#verifyPhoneSubmitError").html(response.data.error_message)
      }
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
  kycCountryChange()
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
        $("#verifyNotice").html("邮件已成功发送到您的收件箱")
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
  if (userData.estimate_currency !== undefined) {
      document.getElementById("kycCurrency").value = userData.estimate_currency
  }
  if (userData.estimate !== undefined) {
    if (userData.estimate_currency === 'XLM') {
      document.getElementById("kycEstimate").value = parseFloat(userData.estimate)*2050
    } else {
      document.getElementById("kycEstimate").value = userData.estimate
    }
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
  pic4Url = userData.pic4
  pic5Url = userData.pic5
  if (pic1Url !== undefined) {
    $("#sampleImage1").attr("src", pic1Url)
    $("#sampleImage1").toggle()
  }
  if (pic2Url !== undefined) {
    $("#sampleImage2").attr("src", pic2Url)
    $("#sampleImage2").toggle()
  }
  if (pic4Url !== undefined) {
    $("#sampleImage4").attr("src", pic4Url)
    $("#sampleImage4").toggle()
  }
  if (pic5Url !== undefined) {
    $("#sampleImage5").attr("src", pic5Url)
    $("#sampleImage5").toggle()
  }
  if (userData.kyc_status === 'rejected') {
    let rejectReason
    switch (userData.reject_type) {
      case 'need_more':
        rejectReason = rejectNote['need_more']
        break
      case 'restricted':
        rejectReason = rejectNote['restricted']
        break
      case 'incorrect':
        rejectReason = rejectNote['incorrect']
        break
      case 'photo_corrupted':
        rejectReason = rejectNote['photo_corrupted']
        break
      case 'other':
        rejectReason = rejectNote['other']
        break
    }
    rejectReason = String(rejectReason).split("\n").join("<br>")
    $("#rejectReason").html(rejectReason)
    if (userData.reject_note_extend !== null && userData.reject_note_extend !== '' && userData.reject_note_extend !== undefined) {
      $("#rejectReasonExtend").html(String(userData.reject_note_extend))
      $("#extendRejectNote").css("display", "block")
    }
  }
  if (userData.is_restricted === true) {
    $("#resubmission").css("display", "none")
  }
  currencyChange()
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
        if (Date.now() > endtimeOfIco && userData.all_done) {
          window.location.href = '/dashboard-cn'+window.location.search
        }
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
  updateUser({
    kyc_status: null,
    reject_note_extend: null
  })
  $("#extendRejectNote").css("display", "none")
}

function proceedToIco() {
  const icoBtn = document.getElementById('toIcoBtn')
  setDisable([icoBtn])
  let uid = firebase.auth().currentUser.uid
  updateUser({all_done: true}).then(() => {
    window.dataLayer = window.dataLayer || [];
    function gtag () {
      dataLayer.push(arguments);
    }
    gtag('event','click',{'event_category':'button','event_label':'finish-kyc'});
    if (Date.now() > endtimeOfIco) {
      window.location.href = '/dashboard-cn'+window.location.search
    }
    setEnable([icoBtn])
    $("#icoPage").addClass("show-detail")
    $('#icoStep').addClass('current')
    $("#congratulationPage").removeClass("show-detail")
  }).catch(() => {
    if (Date.now() > endtimeOfIco) {
      window.location.href = '/dashboard-cn'+window.location.search
    }
    setEnable([icoBtn])
    $("#icoPage").addClass("show-detail")
    $('#icoStep').addClass('current')
    $("#congratulationPage").removeClass("show-detail")
  })
}

function submitKyc() {
  if ($("#kycFormAlert").css('display') == 'block') {
    $("#kycFormAlert").slideToggle()
  }
  window.dataLayer = window.dataLayer || [];
  function gtag () {
    dataLayer.push(arguments);
  }
  gtag('event','click',{'event_category':'button','event_label':'Certified'});
  if (typeof(fbq) !== "undefined") {
    fbq('trackCustom', 'Certified');
  }

  var strUser = firebase.auth().currentUser.uid;
  window._paq = window._paq || [];
  _paq.push(['track_code',"3bf5292d-0432-4171-896f-13f513b2ba19"]);
  _paq.push(['user_id',SHA1(strUser)]);
  _paq.push(['event_name','CA_CONVERSION']);
  _paq.push(['send_event']);
  (function() { var u="//image.cauly.co.kr/script/"; var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0]; g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'caulytracker_async.js'; s.parentNode.insertBefore(g,s); }
  )();

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
  let pic4DOM = document.getElementById('kycPic4')
  let pic5DOM = document.getElementById('kycPic5')
  let estimateDOM = document.getElementById('kycEstimate')
  let estimateCurrencyDOM = document.getElementById("kycCurrency")
  setDisable([btnDOM, firstNameDOM, lastNameDOM, countryDOM, citizenIdDOM, passportNumberDOM, addressDOM, pic1DOM, pic2DOM, pic4DOM, pic5DOM, estimateDOM, estimateCurrencyDOM])
  const first_name = firstNameDOM.value
  const last_name = lastNameDOM.value
  const country = countryDOM.value
  const citizen_id = citizenIdDOM.value
  const passport_number = passportNumberDOM.value
  const address = addressDOM.value
  const pic1 = pic1DOM.files[0]
  const pic2 = pic2DOM.files[0]
  const pic4 = pic4DOM.files[0]
  const pic5 = pic5DOM.files[0]
  let estimate = estimateDOM.value
  const estimate_currency = estimateCurrencyDOM.value
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
  if (country === 'SG' || country === 'CN' || country === 'US') {
    if ($("#kycFormAlert").css('display') == 'none') {
      $("#kycFormAlert").slideToggle()
    }
    $("#kycFormAlertText").html("抱歉，美国、中国和新加坡的公民根据相关法律无法参与此次公开销售。由此造成的不便我们深表歉意。")
    validate = false
  }
  if ((citizen_id == '' || citizen_id == undefined) && country === 'TH') { $('#kycCitizenIdAlert').addClass('invalid'); validate = false }
  if (/^[a-zA-Z0-9 ]+$/.test(citizen_id) === false && country === 'TH') {
    $('#kycCitizenIdAlert').addClass('invalid')
    validate = false
    $("#kycCitizenIdError").html('Citizen ID should contain only alphabetic characters and digits')
    $("#kycCitizenIdError").css('display', 'block')
  }
  if ((passport_number == '' || passport_number == undefined) && country !== 'TH') { $('#kycPassportNumberAlert').addClass('invalid'); validate = false }
  if (/^[a-zA-Z0-9 ]+$/.test(passport_number) === false && country !== 'TH') {
    $('#kycPassportNumberAlert').addClass('invalid')
    validate = false
    $("#kycPassportNumberError").html('Citizen ID should contain only alphabetic characters and digits')
    $("#kycPassportNumberError").css('display', 'block')
  }
  if (address == '' || address == undefined) { $('#kycAddressAlert').addClass('invalid'); validate = false }
//  if (/^[a-zA-Z0-9!”$%&’()*\+, \/;\[\\\]\^_`{|}~\n]+$/.test(address) === false) {
//    $('#kycAddressAlert').addClass('invalid')
//    validate = false
//    $("#kycAddressError").html('Address should contain only alphabetic characters, digits, and special characters')
//    $("#kycAddressError").css('display', 'block')
//  }
  if ((pic1 == '' || pic1 == undefined) && pic1Url === undefined && country === 'TH') { $('#kycPic1Alert').addClass('invalid'); validate = false }
  if ((pic2 == '' || pic2 == undefined) && pic2Url === undefined) { $('#kycPic2Alert').addClass('invalid'); validate = false }
  if ((pic4 == '' || pic4 == undefined) && pic4Url === undefined && country !== 'TH') { $('#kycPic4Alert').addClass('invalid'); validate = false }
  if ((pic5 == '' || pic5 == undefined) && pic5Url === undefined && country === 'TH') { $('#kycPic5Alert').addClass('invalid'); validate = false }
  if (estimate == '' || estimate == undefined) { $('#kycEstimateAlert').addClass('invalid'); validate = false }
  if (/^[0-9\.]+$/.test(estimate) === false) {
    $('#kycEstimateAlert').addClass('invalid')
    validate = false
    $("#kycEstimateError").html('Contribution amount should contain only digits and period')
    $("#kycEstimateError").css('display', 'block')
  }
  if (estimate_currency == '' || estimate_currency == undefined) { $('#kycCurrencyAlert').addClass('invalid'); validate = false }
  if ((parseFloat(estimate) < 0.2 && estimate_currency === 'ETH') || (parseFloat(estimate) < 410 && estimate_currency === 'XLM')) {
    $('#kycEstimateAlert').addClass('invalid')
    validate = false
    if (estimate_currency === 'ETH') {
      $("#kycEstimateError").html('Contribution amount must be at least 0.2 ETH to get the minimum of SIX token')
    } else if (estimate_currency === 'XLM') {
      $("#kycEstimateError").html('Contribution amount must be at least 410 XLM to get the minimum of SIX token')
    }
    $("#kycEstimateError").css('display', 'block')
  }
  if (validate === false) {
    setEnable([btnDOM, firstNameDOM, lastNameDOM, countryDOM, citizenIdDOM, passportNumberDOM, addressDOM, pic1DOM, pic2DOM, pic4DOM, pic5DOM, estimateDOM, estimateCurrencyDOM])
  } else {
    if (estimate_currency === 'XLM') {
      estimate = estimate/2050
    }
    let uid = firebase.auth().currentUser.uid
    let dataToUpdate = {
      first_name: first_name,
      last_name: last_name,
      country: country,
      address: address,
      pic2: pic2Url,
      estimate: estimate,
      estimate_currency: estimate_currency,
      kyc_status: 'pending',
      kyc_submit_time: Math.round((new Date()).getTime() / 1000)
    }
    if (country === 'TH') {
      dataToUpdate.pic1 = pic1Url
      dataToUpdate.pic5 = pic5Url
      dataToUpdate.citizen_id = citizen_id
    } else {
      dataToUpdate.pic4 = pic4Url
      dataToUpdate.passport_number = passport_number
    }
    updateUser(dataToUpdate).then(() => {
      $("#kycContentForm").removeClass("show-detail")
      $("#kycContentPending").addClass("show-detail")
      setEnable([btnDOM, firstNameDOM, lastNameDOM, countryDOM, citizenIdDOM, passportNumberDOM, addressDOM, pic1DOM, pic2DOM, pic4DOM, pic5DOM, estimateDOM, estimateCurrencyDOM])
    }).catch(err => {
      console.log(err.message)
      setEnable([btnDOM, firstNameDOM, lastNameDOM, countryDOM, citizenIdDOM, passportNumberDOM, addressDOM, pic1DOM, pic2DOM, pic4DOM, pic5DOM, estimateDOM, estimateCurrencyDOM])
    })
  }
}

function uploadFile(fileNumber, file) {
  if ($("#pgbarPic"+fileNumber).css('display') == 'none') {
    $("#pgbarPic"+fileNumber).slideToggle()
  }
  if ($("#sampleImage"+fileNumber).css('display') == 'block') {
    $("#sampleImage"+fileNumber).fadeToggle(400, function() { $("#sampleImage"+fileNumber).attr("src", "") })
  }
  $("#kycPicName"+fileNumber).text(file.name)
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
    } else if (fileNumber == 5) {
      pic5Url = downloadURL
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
  $('#kycPic4').change(function () {
    uploadFile(4, this.files[0])
  })
  $('#kycPic5').change(function () {
    uploadFile(5, this.files[0])
  })
  // ===================== //
  // ===== Countdown ===== //
  // ===================== //
  var countDownDate = endtimeOfIco.getTime()
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
      window.location.href = '/cn'+window.location.search
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
