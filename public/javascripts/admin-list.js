
$(document).ready(function(){
	// Search list
	$("body").on("click", ".search i.fa-search", function(){
		$(this).parents(".search").addClass("show-search");
	});

	$("body").on("click", ".search i.fa-times", function(){
		$(this).parents(".search").removeClass("show-search");
	});
});