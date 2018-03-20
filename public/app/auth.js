
function onSubmitRegister () {
  try {
    const submitBtn = document.getElementById("submitRegisterFormBtn")
    submitBtn.classList.add("is-loading")
    const email = document.getElementById('email').value
    const firstName = document.getElementById('firstName').value
    const lastName = document.getElementById('lastName').value
    const phone = document.getElementById('phone').value
    const password = document.getElementById('password').value
    // 1. register first
    return firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(res => {
        const { uid } = res
        return firebase.database().ref(`users/${uid}`).set({
          email,
          firstName,
          lastName,
          phone,
          password
        })
      })
      .then(() => {
        submitBtn.classList.remove("is-loading")
        swal("Success", "Register successful.", "success")
      })
      .catch(err => {
        console.log(err, 'error login')
        submitBtn.classList.remove("is-loading")
        swal("Error", err.message, "warning")
      })

  } catch (err) {
    console.log(err, 'error onSubmitRegister')
  }
}

function onSubmitLogin () {
  const submitBtn = document.getElementById("submitLoginFormBtn")
  submitBtn.classList.add("is-loading")
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  return firebase.auth().signInWithEmailAndPassword(email, password)
    .then(res => {
      console.log(res, 'res')
      submitBtn.classList.remove("is-loading")
      swal("Success", "Login successful.", "success")
    })
    .catch(err => {
      console.log(err, 'error login')
      submitBtn.classList.remove("is-loading")
      swal("Error", err.message, "warning")
    })
}

function logout () {
  const submitBtn = document.getElementById("logoutBtn")
  submitBtn.classList.add("is-loading")
  return firebase.auth().signOut()
    .then(() => {
      submitBtn.classList.remove("is-loading")
      // $('#loginForm').show()
      // $('#logoutForm').hide()
    })
}

function forgotPassword () {
  const submitBtn = document.getElementById("submitForgotBtn")
  submitBtn.classList.add("is-loading")
  const email = document.getElementById('email').value
  return firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      submitBtn.classList.remove("is-loading")
      swal("Success", "Sent password reset to your email, Please check your inbox.", "success")
    })
    .catch(err => {
      console.log(err, 'error login')
      submitBtn.classList.remove("is-loading")
      swal("Error", err.message, "warning")
    })
}

$(document).ready(function() {

  $("#signupForm").submit(function(e) {
    e.preventDefault()
    onSubmitRegister()
  })

  $("#loginForm").submit(function(e) {
    console.log('.....')
    e.preventDefault()
    onSubmitLogin()
  })

  $('#forgotPasswordForm').submit(function(e) {
    e.preventDefault()
    forgotPassword()
  })

  firebase.auth().onAuthStateChanged(function(user) {
    if (user && user.uid) {
      $('#loginForm').hide()
      $('#logoutForm').show()
    } else {
      $('#logoutForm').hide()
      $('#loginForm').show()
    }
  })


})