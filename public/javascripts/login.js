// global variable for stopping register from redirect before insert to db
var stopRedirection = false

// Forgot password function using in Login page for recovering user's account
function forgotPassword () {
  if ($('#forgotPasswordText').css('display') == 'block') {
    $('#forgotPasswordText').slideToggle()
  }
  let emailDOM = document.getElementById('forgotPasswordEmail')
  let btnDOM = document.getElementById('forgotPasswordBtn')
  const email = emailDOM.value
  setDisable([emailDOM, btnDOM])
  return firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      $('#forgotPasswordText').html('Email sent to inbox')
      if ($('#forgotPasswordText').css('display') == 'none') {
        $('#forgotPasswordText').slideToggle()
      }
      setEnable([emailDOM, btnDOM])
    })
    .catch(err => {
      $('#forgotPasswordText').html('Email sent to inbox')
      if ($('#forgotPasswordText').css('display') == 'none') {
        $('#forgotPasswordText').slideToggle()
      }
      setEnable([emailDOM, btnDOM])
    })
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

// Login function using in Login page to authorize user with email and password and also check verified status
function login () {
  $('#signInAlert').removeClass('show-alert')
  let emailDOM = document.getElementById('signInEmail')
  let passwordDOM = document.getElementById('signInPassword')
  let btnDOM = document.getElementById('signInBtn')
  const password = passwordDOM.value
  const email = emailDOM.value
  setDisable([emailDOM, passwordDOM, btnDOM])
  return firebase.auth().signInWithEmailAndPassword(email, password)
    .catch(err => {
      console.log(err)
      if (err.code == 'auth/wrong-password' || err.code == 'auth/user-not-found') {
        $('#signInAlertText').html('Invalid email or password')
      } else {
        $('#signInAlertText').html(err.message)
      }
      $('#signInAlert').addClass('show-alert')
      setEnable([emailDOM, passwordDOM, btnDOM])
    })
}

// Lock signin form while authorize using socialmedia
function lockSigninForm () {
  let emailDOM = document.getElementById('signInEmail')
  let passwordDOM = document.getElementById('signInPassword')
  let btnDOM = document.getElementById('signInBtn')
  setDisable([emailDOM, passwordDOM, btnDOM])
}

// Unlock signin form after authorize using socialmedia
function unlockSigninForm () {
  let emailDOM = document.getElementById('signInEmail')
  let passwordDOM = document.getElementById('signInPassword')
  let btnDOM = document.getElementById('signInBtn')
  setEnable([emailDOM, passwordDOM, btnDOM])
}

// Sign up function using in Login page to register user with email and password
function signUp () {
  $('#signUpAlert').removeClass('show-alert')
  let emailDOM = document.getElementById('signUpEmail')
  let firstNameDOM = document.getElementById('signUpFirstName')
  let lastNameDOM = document.getElementById('signUpLastName')
  let phoneNumberDOM = document.getElementById('signUpPhoneNumber')
  let passwordDOM = document.getElementById('signUpPassword')
  let countryDOM = document.getElementById('signUpCountry')
  let btnDOM = document.getElementById('signUpBtn')
  const email = emailDOM.value
  const first_name = firstNameDOM.value
  const last_name = lastNameDOM.value
  const phone_number_temp = phoneNumberDOM.value
  const password = passwordDOM.value
  const country = countryDOM.value
  setDisable([emailDOM, firstNameDOM, lastNameDOM, phoneNumberDOM, passwordDOM, btnDOM, countryDOM])
  const parseData = libphonenumber.parse(phone_number_temp, country, {extended: true })
  if (parseData.valid === false) {
    $('#signUpAlertText').html("Invalid phone number format")
    $('#signUpAlert').addClass('show-alert')
    setEnable([emailDOM, firstNameDOM, lastNameDOM, phoneNumberDOM, passwordDOM, btnDOM, countryDOM])
    return false
  }
  const phone_number = '+'+parseData.countryCallingCode+parseData.phone
  phoneNumberDOM.value = phone_number
  stopRedirection = true
  return firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(res => {
      const {uid} = res
      res.sendEmailVerification()
      return firebase.firestore().collection('users').doc(uid).set({
        email,
        first_name,
        last_name,
        phone_number,
        country
      }, { merge: true})
        .then(() => {
          stopRedirection = false
          checkLoginState()
        })
        .catch((err) => {
          firebase.auth().signOut()
          stopRedirection = false
          console.log(err)
          $('#signUpAlertText').html(err.message)
          $('#signUpAlert').addClass('show-alert')
          setEnable([emailDOM, firstNameDOM, lastNameDOM, phoneNumberDOM, passwordDOM, btnDOM, countryDOM])
        })
    })
    .catch(err => {
      firebase.auth().signOut()
      stopRedirection = false
      console.log(err)
      $('#signUpAlertText').html(err.message)
      $('#signUpAlert').addClass('show-alert')
      setEnable([emailDOM, firstNameDOM, lastNameDOM, phoneNumberDOM, passwordDOM, btnDOM, countryDOM])
    })
}

// AuthFacebook function using in Login page for authorize user's facebook account
function authFacebook () {
  let provider = new firebase.auth.FacebookAuthProvider()
  provider.addScope('email')
  firebase.auth().languageCode = 'en_EN'
  provider.setCustomParameters({
    'display': 'popup'
  })
  stopRedirection = true
  lockSigninForm()
  return firebase.auth().signInWithPopup(provider)
    .then(res => {
      const {uid} = res.user
      const {email} = res.user
      let ref = firebase.firestore().collection('users').doc(uid)
      return ref.get()
        .then(docSnapshot => {
          if (!docSnapshot.exists) {
            ref.set({
              email
            },{ merge: true})
              .then(() => {
                stopRedirection = false
                checkLoginState()
              })
              .catch((err) => {
                firebase.auth().signOut()
                stopRedirection = false
                unlockSigninForm()
                console.log('Authorize Facebook : error : ', err)
              })
          } else {
            stopRedirection = false
            checkLoginState()
          }
        })
        .catch((err) => {
          firebase.auth().signOut()
          stopRedirection = false
          unlockSigninForm()
          console.log('Authorize Facebook : error : ', err)
        })
    })
    .catch(err => {
      firebase.auth().signOut()
      stopRedirection = false
      unlockSigninForm()
      console.log('Authorize Facebook : error : ', err)
    })
}

// AuthGoogle function using in Login page for authorize user's google account
function authGoogle () {
  let provider = new firebase.auth.GoogleAuthProvider()
  provider.addScope('email')
  firebase.auth().languageCode = 'en'
  stopRedirection = true
  lockSigninForm()
  return firebase.auth().signInWithPopup(provider)
    .then(res => {
      const {uid} = res.user
      const {email} = res.user
      let ref = firebase.firestore().collection('users').doc(uid)
      return ref.get()
        .then(docSnapshot => {
          if (!docSnapshot.exists) {
            ref.set({
              email
            }, { merge: true})
              .then(() => {
                stopRedirection = false
                checkLoginState()
              })
              .catch((err) => {
                firebase.auth().signOut()
                stopRedirection = false
                unlockSigninForm()
                console.log('Authorize Google : error : ', err)
              })
          } else {
            stopRedirection = false
            checkLoginState()
          }
        })
        .catch((err) => {
          firebase.auth().signOut()
          stopRedirection = false
          unlockSigninForm()
          console.log('Authorize Google : error : ', err)
        })
    })
    .catch(err => {
      firebase.auth().signOut()
      stopRedirection = false
      unlockSigninForm()
      console.log('Authorize Google : error : ', err)
    })
}

// Check current login state the redirect
function checkLoginState (user = undefined) {
  if (user === undefined) {
    user = firebase.auth().currentUser
  }
  if (user && user.uid && stopRedirection == false) {
    console.log('Go to Wizard')
    window.location.href = 'wizard'
  } else {
    $('#preLoader').fadeToggle()
  }
}

$(document).ready(function () {
  // Sign up, Sign in
  $('body').on('click', '.login header .btn-tool a', function () {
    if ($(this).hasClass('open-sign-up')) {
      $(this).parents('section').find('.sign-in, .forgot').removeClass('show-detail')
      $(this).parents('section').find('.sign-up').addClass('show-detail')
      $(this).parent('.btn-tool').find('p').text('Have an account?')
      $(this).removeClass('open-sign-up').addClass('open-sign-in').text('Sign in')
    } else if ($(this).hasClass('open-sign-in')) {
      $(this).parents('section').find('.sign-up, .forgot').removeClass('show-detail')
      $(this).parents('section').find('.sign-in').addClass('show-detail')
      $(this).parent('.btn-tool').find('p').text("Don't have an account?")
      $(this).removeClass('open-sign-in').addClass('open-sign-up').text('Sign up')
    }
  })

  // Forgot password
  $('body').on('click', '.login a.open-forgot', function () {
    $(this).parents('section').find('.sign-in, .sign-up').removeClass('show-detail')
    $(this).parents('section').find('.forgot').addClass('show-detail')
  })

  // Sign
  $('body').on('click', '.login a.open-sign-in', function () {
    $(this).parents('section').find('.forgot, .sign-up').removeClass('show-detail')
    $(this).parents('section').find('.sign-in').addClass('show-detail')
  })

  $('body').keydown(function (e) {
    if (e.keyCode == 13) {
      $('.login .sign-in form button').click()
    }
  })

  // Slider
  var $slider = $('ul.slider-img'),
    $container = $slider.find('.slide'),
    $nav = $('ul.slider-nav'),
    $slide = $container.children(),
    s_length = $slide.length,
    s_wide = $slider.width() * s_length,
    s_height = $slider.height(),
    autoSlide = null

  // Click to switch
  $nav.find('li').on('click', function (pos) {
    $nav.find('.current').removeClass('current')
    $(this).addClass('current')
    pos = $(this).index() * $slider.width()
    $container.animate({left: '-' + pos + 'px'}, 600)
    clearInterval(autoSlide)
    autoSlide = setInterval(slideShow, 3000)
    return false
  }).first().addClass('current')

  function slideShow () {
    if ($nav.find('.current').next().length) {
      $nav.find('.current').next().trigger('click')
    } else {
      $nav.find('li').first().trigger('click')
    }
  }

  autoSlide = setInterval(slideShow, 3000)

  // Listening to auth state change
  firebase.auth().onAuthStateChanged(function (user) {
    checkLoginState(user)
  })

  // Override submit on forgot password form
  $('#forgotPasswordForm').submit(function (e) {
    e.preventDefault()
    forgotPassword()
  })

  // Override submit on login form
  $('#signInForm').submit(function (e) {
    e.preventDefault()
    login()
  })

  // Override submit on signup form
  $('#signUpForm').submit(function (e) {
    e.preventDefault()
    signUp()
  })
})
