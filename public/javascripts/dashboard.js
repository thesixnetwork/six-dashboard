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
  const currentUser = firebase.auth().currentUser
  const warning1DOM = document.getElementById('warning1')
  const warning2DOM = document.getElementById('warning2')
  const warning3DOM = document.getElementById('warning3')
  const btnDOM = document.getElementById('acknowledgeBtn')
  setDisable([warning1DOM, warning2DOM, warning3DOM, btnDOM])
  const dbRef = firebase.firestore().collection('user-dashboard').doc(currentUser.uid)
  return dbRef.set({acknowledge: true}, {merge: true}).then({
    
  })
}

$(document).ready(function(){
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

		// payment
    $('body').on('click', '.payment-box button', function(){
			$(".payment-box").removeClass("show-detail")
			$(".address-history").addClass("show-detail")
		});

    $('body').on('click', '[class^="dialog-"] dialog a.close', function(){
			$(this).parents('[class^="dialog-"]').removeClass('show-dialog');
		});
});
