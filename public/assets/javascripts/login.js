function submitLogin(email, password) {
  $('input').prop( "disabled", true );
  console.log("email" + email)
  console.log("password" + password)
  firebase.auth().signInWithEmailAndPassword(email, password).then(function(result) {
    if (result.emailVerified) {
      flashDisplayer.addAndDisplayQueues({message: 'Authentication success!', type: 'success'})
      setTimeout(function(){
        window.location = "dashboard"
      }, 2500);
      $('input').prop( "disabled", false );
    } else {
      flashDisplayer.addAndDisplayQueues({message: 'Please verify your email address!', type: 'error'})
      $('input').prop( "disabled", false );
    }
  }).catch(function(error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    if (errorCode === 'auth/wrong-password') {
      flashDisplayer.addAndDisplayQueues({message: 'Incorrect Email/Password!', type: 'error'})
    } else {
      flashDisplayer.addAndDisplayQueues({message: errorMessage, type: 'error'})
    }
    console.log(error);
    $('input').prop( "disabled", false );
  });
}

function submitFacebook() {
  $('input').prop( "disabled", true );
  var provider = new firebase.auth.FacebookAuthProvider();
  provider.addScope('email');
  firebase.auth().languageCode = 'en_EN';
  provider.setCustomParameters({
    'display': 'popup'
  });
  firebase.auth().signInWithPopup(provider).then(function(result) {
    flashDisplayer.addAndDisplayQueues({message: 'Authentication success!', type: 'success'})
    var token = result.credential.accessToken;
    var user = result.user;
    $('input').prop( "disabled", false );
  }).catch(function(error) {
    flashDisplayer.addAndDisplayQueues({message: error.message, type: 'error'})
    $('input').prop( "disabled", false );
    var errorCode = error.code;
    var errorMessage = error.message;
    var email = error.email;
    var credential = error.credential;
  });
}

function submitGoogle() {
  $('input').prop( "disabled", true );
  var provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
  firebase.auth().languageCode = 'en';
  firebase.auth().signInWithPopup(provider).then(function(result) {
    flashDisplayer.addAndDisplayQueues({message: 'Authentication success!', type: 'success'})
    var token = result.credential.accessToken;
    $('input').prop( "disabled", false );
    var user = result.user;
  }).catch(function(error) {
    flashDisplayer.addAndDisplayQueues({message: error.message, type: 'error'})
    var errorCode = error.code;
    var errorMessage = error.message;
    var email = error.email;
    var credential = error.credential;
    $('input').prop( "disabled", false );
  });
}

function submitSignup(email, password) {
  $('input').prop( "disabled", true );
  firebase.auth().createUserWithEmailAndPassword(email, password).then(function(user) {
    flashDisplayer.addAndDisplayQueues({message: 'Signup success!', type: 'success'})
    user.sendEmailVerification()
    $('input').prop( "disabled", false );
  }).catch(function(error) {
    flashDisplayer.addAndDisplayQueues({message: error.message, type: 'error'})
    var errorCode = error.code;
    $('input').prop( "disabled", false );
    var errorMessage = error.message;
  });
}


$( document ).ready(function() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      if (user.emailVerified == true) {
        window.location = "dashboard"
      }
    } else {
      sceneDisplayer.show()
    }
  });
})
