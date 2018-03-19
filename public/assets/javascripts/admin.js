function signout() {
  firebase.auth().signOut().then(function() {
    flashDisplayer.addAndDisplayQueues({message: 'Signout success!', type: 'success'})
  }).catch(function(error) {
    flashDisplayer.addAndDisplayQueues({message: error.message, type: 'error'})
  })
}

function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.className = 'items'
  div.innerHTML = htmlString.trim();
  return div; 
}

function initializeDatabase() {
  var db = firebase.firestore();
  var citiesRef = db.collection("users");
  var query = citiesRef.where("verified", "==", false).where("rejected", "==", false)
  query.get().then(function(docs) {
    docs.forEach(function(doc) {
      var elem = createElementFromHTML(""+
    "<table id='user_data'>"+
    "  <tbody>"+
    "    <tr>"+
    "      <td>Firstname</td>"+
    "      <td>"+doc.data().first+"</td>"+
    "    </tr>"+
    "    <tr>"+
    "      <td>lastname</td>"+
    "      <td>"+doc.data().last+"</td>"+
    "    </tr>"+
    "    <tr>"+
    "      <td>phone</td>"+
    "      <td>"+doc.data().phone+"</td>"+
    "    </tr>"+
    "    <tr>"+
    "      <td>pic1</td>"+
    "      <td><img src='"+doc.data().pic1+"'></img></td>"+
    "    </tr>"+
    "    <tr>"+
    "      <td>pic2</td>"+
    "      <td><img src='"+doc.data().pic2+"'></img></td>"+
    "    </tr>"+
    "    <tr>"+
    "      <td>xlm</td>"+
    "      <td>"+doc.data().xlm+"</td>"+
    "    </tr>"+
    "  </tbody>"+
      "</table>"+
      "<a href=\"javascript:approve('"+doc.id+"');\" class='approve_btn'>approve</a>"+
      "<a href=\"javascript:reject('"+doc.id+"');\" class='reject_btn'>reject</a>")
      console.log(doc.id, " => ", doc.data());
      $(".wrapper")[0].appendChild(elem)
    });
    sceneDisplayer.show()
  }).catch(function(error){
    sceneDisplayer.show()
  })
}

function approve(user_id) {
  var db = firebase.firestore();
  db.collection("users").doc(user_id).set({
    verified: true,
    rejected: false,
  }).then(function(docRef) {
    flashDisplayer.addAndDisplayQueues({message: 'Approve success!', type: 'success'})
  }).catch(function(error) {
    flashDisplayer.addAndDisplayQueues({message: error.message, type: 'error'})
    console.error("Error setting document: ", error);
  });
}

function reject(user_id) {
  var db = firebase.firestore();
  db.collection("users").doc(user_id).set({
    verified: false,
    rejected: true,
  }).then(function(docRef) {
    flashDisplayer.addAndDisplayQueues({message: 'Reject success!', type: 'success'})
  }).catch(function(error) {
    flashDisplayer.addAndDisplayQueues({message: error.message, type: 'error'})
    console.error("Error setting document: ", error);
  });
}

$( document ).ready(function() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      initializeDatabase()
//      sceneDisplayer.show()
    } else {
      window.location = "/"
    }
  });
})

