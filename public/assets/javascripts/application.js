function flashDisplayer() {

};

function sceneDisplayer() {

}

sceneDisplayer.show = function() {
  $("#scene").fadeToggle(500);
}

flashDisplayer.addAndDisplayQueues = function(data) {
  flashDisplayer.messageQueues.push(data)
  if (flashDisplayer.state == 0 || flashDisplayer.state === undefined) {
    flashDisplayer.display();
  }
};

flashDisplayer.display = function() {
  if (flashDisplayer.messageQueues.length > 0 && (flashDisplayer.state == 0 || flashDisplayer.state === undefined)) {
    flashDisplayer.state = 1;
    var dataToDisplay = flashDisplayer.messageQueues.shift();
    var typeToDisplay, iconClass
    switch(dataToDisplay.type) {
    case "success":
      typeToDisplay = "success"
      iconClass = "check"
      $("#bad_flash_icon").hide()
      $("#good_flash_icon").show()
      break;
    case "error":
      typeToDisplay = "error"
      iconClass = "ban"
      $("#good_flash_icon").hide()
      $("#bad_flash_icon").show()
      break;
    };
    $("#flash_displayer span span").text(dataToDisplay.message);
    $("#flash_displayer").removeClass().addClass(typeToDisplay);
    $("#flash_displayer").css({top: "0px"});
    setTimeout(function(){
      flashDisplayer.hide();
    }, 2500);
  };
};

flashDisplayer.hide = function() {
  $("#flash_displayer").css({top: "-35px"})
  setTimeout(function(){
    flashDisplayer.state = 0;
    if (flashDisplayer.messageQueues.length > 0) {
      flashDisplayer.display();
    };
  }, 500);
};

if (flashDisplayer.messageQueues === undefined) {
  flashDisplayer.messageQueues = [];
};
