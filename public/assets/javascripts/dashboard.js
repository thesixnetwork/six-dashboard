function signout() {
  firebase.auth().signOut().then(function() {
    flashDisplayer.addAndDisplayQueues({message: 'Signout success!', type: 'success'})
  }).catch(function(error) {
    flashDisplayer.addAndDisplayQueues({message: error.message, type: 'error'})
  })
}

function uploadKyc(firstname, lastname, phone, pic1, pic2, xlm) {
  var user = firebase.auth().currentUser
  var ref = firebase.storage().ref();
  var pic1Ref = ref.child(user.uid+'/'+pic1.name);
  pic1Ref.put(pic1).then(function(snapshot) {
    console.log('Uploaded a blob or file!');
    var pic2Ref = ref.child(user.uid+'/'+pic2.name);
    pic2Ref.put(pic2).then(function(snapshot2) {
      console.log('Uploaded a blob or file2!');
      var db = firebase.firestore();
      db.collection("users").doc(user.uid).set({
        first: firstname,
        last: lastname,
        phone: phone,
        pic1: snapshot.downloadURL,
        pic2: snapshot2.downloadURL,
        verified: false,
        xlm: xlm,
        rejected: false,
      }).then(function(docRef) {
        flashDisplayer.addAndDisplayQueues({message: 'Upload success!', type: 'success'})
      }).catch(function(error) {
        flashDisplayer.addAndDisplayQueues({message: error.message, type: 'error'})
        console.error("Error adding document: ", error);
      });
    }).catch(function(error){
      flashDisplayer.addAndDisplayQueues({message: error.message, type: 'error'})
      console.log(error.message)
    });
  }).catch(function(error){
    flashDisplayer.addAndDisplayQueues({message: error.message, type: 'error'})
    console.log(error.message)
  });
}

function initializeDatabase(user) {
  var db = firebase.firestore();
  db.collection("users").doc(user.uid).get().then(function(doc) {
    console.log(doc.data())
    if (doc.data() !== undefined) {
      if (doc.data().rejected == false) {
        if (doc.data().verified == false) {
          $("#kyc_status")[0].innerHTML = "pending"
        } else {
          $("#kyc_status")[0].innerHTML = "verified"
        }
      } else {
        $("#kyc_status")[0].innerHTML = "rejected"
      }
      if (doc.data().xlm !== undefined) {
        $.ajax({
          url: "https://horizon-testnet.stellar.org/accounts/" +doc.data().xlm,
        }).done(function(response) {
          var filtered = response.balances.filter(function(x) { return x.asset_code == "GasDollar" && x.asset_issuer == "GBNDDPGKHTBSR2U4ZKPFFNONPPU55VAHWNB3D5FV3FHG5LBZJU4ZVEXQ"; })[0];
          if (filtered !== undefined) {
            $("#bought_status")[0].innerHTML = filtered.balance
          }
        });
      }
    }
    sceneDisplayer.show()
  }).catch(function(error){
    sceneDisplayer.show()
  })
}

$( document ).ready(function() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      initializeDatabase(user)
//      sceneDisplayer.show()
    } else {
      window.location = "/"
    }
  });
})
