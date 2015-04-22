//////////////////////////////////////////////////////////////////////////
//  CONTROLS
//
//  Controls: Switch modes & fill select boxes
//  External functions: registerModeObject, setMode, getCurrentModeObject,
//						clearSelectbox, resetSubFamilySelectors, 
//						whoopsNetworkError, resetMap
//	Internal functions: fillSelectbox
//////////////////////////////////////////////////////////////////////////

var controls = (function() {
	var external = {}; // methods and variables to return and expose externally
	
	
	// keep track of which mode is currently selected
	var modes = ["diversityMode", "speciesMode", "diversityBentityMode"];
	var currentMode = modes[0];


	// How modes are encoded/decoded in Antmaps URLs.  (To change this, you also
	// have to change them in the getURLParams() function of each mode module.)
	var modeURLCodes = {
		"diversity": "diversityMode",
		"species":   "speciesMode",
		"region":    "diversityBentityMode"
	}




	// references to each of the mode objects.  This is filled in at the bottom
	// of this file, after the mode objects have been declared.  Keys are the modes in 'modes' variable
	external.modeObjects = {};  
	
	// called in each mode file
	external.registerModeObject = function(name, obj) {
		external.modeObjects[name] = obj;
	};
	
	
	
	// get the current mode object
	external.getCurrentModeObject = function() {
		return external.modeObjects[currentMode];
	};
	
	external.getCurrentModeName = function() {
		return currentMode;
	};
	
	
	
	// set the current mode
	external.setMode = function(modeName) {
	
		external.getCurrentModeObject().deactivateMode();
		currentMode = modeName;
		
		external.hideAllWidgets();
		
		external.getCurrentModeObject().activateMode();
		
		external.getCurrentModeObject().showViewWidgets();
		
		
		// hilight button for current mode
		$(".button").removeClass("button-selected");
		if(modeName=="speciesMode"){
			$("#species-button").addClass("button-selected");
		}else if(modeName=="diversityBentityMode"){
			$("#diveristy-bentity-button").addClass("button-selected");
		}else if(modeName=="diversityMode"){
			$("#diversity-button").addClass("button-selected");
		}
	}


	
	
	// called by baseMap after bentities are loaded
	external.setDefaultMode = function() {
		decodeURL(); // set initial mode from URL
	}
	
	
	

	external.hideWelcomeMessage = function(){
		$("#welcome-message").css("display","none");
		$("#welcome-message-bg-bg").css("display","none");
		$("#welcome-message-bg").css("display","none");
		$("#welcome-overlay").css("display","none");
	};
	
	
	
	//hides all view-specific widgets
	external.hideAllWidgets = function(){
		$('#view-title').html('');
		$("#spp_view").css("display","none");

		$(".mode-controls").hide();

		$("#entry-text").css("display","none");
		$("#select-bentity-button").hide();
	};
	
	
	external.hideEntryText= function(){
		$(".button").hover(function() {
			$("#entry-text").css("display","none");
		});
	};
	
	

	

	// Different Views Tooptip

	$("#species-button").hover(
		function(){
			$("#view-description").html("Select a species via the drop down menu after filtering by subfamily and genus to map its distribution, see its status in a region, and retrieve information on individual records.");
			$("#view-description").css("background-color","white");
			$("#view-description").css("padding",5);
		},function(){
			$("#view-description").html('');
			$("#view-description").css("background-color","none");
			$("#view-description").css("padding",0);
	});
	
	
	$("#diveristy-bentity-button").hover(
		function(){
			$("#view-description").css("background-color","white");
			$("#view-description").css("padding",5);
			$("#view-description").html("Select a region, by clicking on the map or via the drop down menu to visualize how its fauna is distributed across other regions. To map a different region click on 'MAP A DIFFERENT REGION'.");
		},function(){
			$("#view-description").html('');
			$("#view-description").css("background-color","none");
			$("#view-description").css("padding",0);
	});
	
	$("#diversity-button").hover(
		function(){
			$("#view-description").css("background-color","white");
			$("#view-description").css("padding",5);
			$("#view-description").html("Select a species via the drop down menu after filtering by subfamily and genus to map its distribution, see its status in a region, and retrieve information on individual records.");
		},function(){
			$("#view-description").html('');
			$("#view-description").css("background-color","none");
			$("#view-description").css("padding",0);
	});
	
	

	// Taxon select boxes
	// Populate a given select box (jquery object) with the given data
	// fires a "listupdate" event after updated
	function fillSelectbox(JQselectbox, data) {
		for (var i = 0; i < data.length; i++) {
			$('<option/>', {text:data[i].display, value:data[i].key}).appendTo(JQselectbox);
		}
		JQselectbox.trigger("listupdate");
	}
	


	// Taxon select boxes
	// Disable sub-select boxes
	external.clearSelectbox = function() {
		var boxes = $('#sppView-species-select');
		boxes.prop('disabled', true);
	};
	


	// On page load, get list of subfamilies and fill subfamily select boxes
	$(document).ready(function() {
		$.getJSON('/dataserver/subfamily-list')
		.done(function(data) {
			var boxes = $('#diversityView-subfamily-select, #sppView-subfamily-select');
			
			boxes.html('<option value="">All Subfamilies</option>');
			
			fillSelectbox(boxes, data.subfamilies);
			boxes.prop('disabled', false);
		})
		.fail(external.whoopsNetworkError);
	});
	
	
	
	
	// On page load, get list of subfamilies and fill bentity select box
	$(document).ready(function() {
		$.getJSON('/dataserver/bentity-list')
		.done(function(data) {
			var boxes = $('#bentityView-bentity-select');
			boxes.html('<option value="">Select Region</option>');
			fillSelectbox(boxes, data.bentities);
			boxes.prop('disabled', false);
		})
		.fail(external.whoopsNetworkError);
	});
	
	


	// reset subfamiy selector controls (called by resetAll)
	external.resetSubFamilySelectors = function(){
			$('#diversityView-subfamily-select, #sppView-subfamily-select')
				.val('')
				.trigger('change'); // resets related select boxes
	};
	
	
	

	// When the species-mode subfamily select box changes, populate species-mode genus select box
	$('#sppView-subfamily-select').change(function() {
		var selected = $(this).val();
		$('#sppView-species-select').html('<option value="">Select Species</option>').prop('disabled', 'disabled');

		var box = $('#sppView-genus-select');
		box.html('<option value="">Loading...</option>');
		box.prop('disabled', 'disabled');
		$.getJSON('/dataserver/genus-list', {subfamily: selected}, function(data) {
			box.html('<option value="">Select Genus</option>');
			fillSelectbox(box, data.genera);
			box.prop('disabled', false);
		})
		.fail(external.whoopsNetworkError);

	});
	$('#sppView-subfamily-select').change(); // load all genera on page load
	



	// When the species-mode "select-genus" box changes, update the species-mode 'select-species' box
	$('#sppView-genus-select').change(function() {
		var selected = $(this).val();
		if (selected) {
			var box = $('#sppView-species-select');
			box.html('<option value="">Loading...</option>');
			box.prop('disabled', 'disabled');
			$.getJSON('/dataserver/species-list', {genus: selected}, function(data) {
				box.html('<option value="">Select Species</option>');
				fillSelectbox(box, data.species);
				box.prop('disabled', false);
			})
			.fail(external.whoopsNetworkError);
		}
		else {
			$('#sppView-species-select').html('<option value="">Select Species</option>').prop('disabled', 'disabled');
		}
	});
	
	
	
	

	// When the genus-view subfamily select box changes, populate genus select box
	$('#diversityView-subfamily-select').change(function() {
		var selected = $(this).val() || '';
		var box = $('#diversityView-genus-select');
		box.html('<option value="">Loading...</option>');
		box.prop('disabled', 'disabled');
		$.getJSON('/dataserver/genus-list', {subfamily: selected}, function(data) {
			box.html('<option value="">All Genera</option>');
			fillSelectbox(box, data.genera);
			box.prop('disabled', false);
		})
		.fail(external.whoopsNetworkError);
	});
	$('#diversityView-subfamily-select').change(); // populate on startup




	
	// species-view Prev/Next buttons, one function for each select box
	// For each function, "direction" should be "prev" or "next"
	(function() {
		function nextSppviewSubfamily(direction) {
			// get next or pevious option depending on selection
			var selected = $("#sppView-subfamily-select option:selected");
			var nextOption = (direction=="prev") ? selected.prev() : selected.next();
				
			if (nextOption.length) {
				// if there's a next option, select it
				$("#sppView-subfamily-select").val(nextOption.val());
				$("#sppView-subfamily-select").change();
			}
			else { // no next option
				if (direction=="prev") {
					// if we're going backwards, select the last option
					$("#sppView-subfamily-select").val($("#sppView-subfamily-select option:last").val());
					$("#sppView-subfamily-select").change();
				}
				else {
					// if we're going forwards, select the first option
					$("#sppView-subfamily-select").val($("#sppView-subfamily-select option:first").val());
					$("#sppView-subfamily-select").change();
				}
			}
		}
		
		function nextSppviewGenus(direction) {
			// get next or pevious option depending on selection
			var selected = $("#sppView-genus-select option:selected");
			var nextOption = (direction=="prev") ? selected.prev() : selected.next();
			
			if (nextOption.length && nextOption.val()) {
				// if there's a next option, select it
				$("#sppView-genus-select").val(nextOption.val());
				$("#sppView-genus-select").change();
			}
			else {
				// if this is the last option, get the next subfamily, then get the next genus
				$("#sppView-genus-select").one("listupdate", function(){
					if (direction=="prev") {
						// select last species if we're going backwards and just updated genus
						$("#sppView-genus-select").val($("#sppView-genus-select option:last").val());
						$("#sppView-genus-select").change();
					}
					else {
						nextSppviewGenus(direction);
					}
				});
				nextSppviewSubfamily(direction);
			}
		}
		
		function nextSppviewSpecies(direction) {
			// get next or pevious option depending on selection
			var selected = $("#sppView-species-select option:selected");
			var nextOption = (direction=="prev") ? selected.prev() : selected.next();
			
			if (nextOption.length && nextOption.val()) {
				// if there's a next option, select it
				$("#sppView-species-select").val(nextOption.val());
				$("#sppView-species-select").change();
			}
			else {
				// if this is the last option, get the next genus, then get the next species
				$("#sppView-species-select").one("listupdate", function(){
					if (direction=="prev") {
						// select last species if we're going backwards and just updated genus
						$("#sppView-species-select").val($("#sppView-species-select option:last").val());
						$("#sppView-species-select").change();
					}
					else { 
						nextSppviewSpecies(direction);
					}
				});
				nextSppviewGenus(direction);
			}
		}
		
		$("#sppView-next").click(function(){nextSppviewSpecies("next")});
		$("#sppView-prev").click(function(){nextSppviewSpecies("prev")});
	})();






	(function() {
		function nextDiversityviewSubfamily(direction) {
			// get next or pevious option depending on selection
			var selected = $("#diversityView-subfamily-select option:selected");
			var nextOption = (direction=="prev") ? selected.prev() : selected.next();
							if (nextOption.length) {
				// if there's a next option, select it
				$("#diversityView-subfamily-select").val(nextOption.val());
				$("#diversityView-subfamily-select").change();
			}
			else { // no next option
				if (direction=="prev") {
					// if we're going backwards, select the last option
					$("#diversityView-subfamily-select").val($("#diversityView-subfamily-select option:last").val());
					$("#diversityView-subfamily-select").change();
				}
				else {
					// if we're going forwards, select the first option
					$("#diversityView-subfamily-select").val($("#diversityView-subfamily-select option:first").val());
					$("#diversityView-subfamily-select").change();
				}
			}
		}
		
		
		$("#diversityView-subfamily-next").click(function(){ nextDiversityviewSubfamily("next") });
		$("#diversityView-subfamily-prev").click(function(){ nextDiversityviewSubfamily("prev") });
		
		
		
		
		function nextDiversityviewGenus(direction) {
			// get next or pevious option depending on selection
			var selected = $("#diversityView-genus-select option:selected");
			var nextOption = (direction=="prev") ? selected.prev() : selected.next();
			
			if (nextOption.length) {
				// if there's a next option, select it
				$("#diversityView-genus-select").val(nextOption.val());
				$("#diversityView-genus-select").change();
			}
			else {
				// if this is the last option, get the next subfamily, then get the next genus
				$("#diversityView-genus-select").one("listupdate", function(){
					if (direction=="prev") {
						// select last species if we're going backwards and just updated genus
						$("#diversityView-genus-select").val($("#diversityView-genus-select option:last").val());
					}
					$("#diversityView-genus-select").change();

				});
				nextDiversityviewSubfamily(direction);
			}
		}
		
		$("#diversityView-genus-next").click(function(){ nextDiversityviewGenus("next") });
		$("#diversityView-genus-prev").click(function(){ nextDiversityviewGenus("prev") });
		
	})();





	// display error message
	external.whoopsNetworkError = function() {
		alert('Whoops!  Something went wrong.  Please check your internet connection and try again, or refresh the page.');
	}





	// Resets the map to its original view as when just loaded
	// Resets zoom, sets toggle button to species view, clear points, 
	// resets dropdown menus, closes all info panels
	external.resetMap = function(){
		
		// reset data for all modes		
		for (var i = 0; i < modes.length; i++) {
			external.modeObjects[modes[i]].resetData();
		}
		
		controls.setMode("diversityMode");
		
		external.resetSubFamilySelectors();
		
		$(".infopanel").css("display","none");

		baseMap.resetZoom(); 
	}



	// Open report-an-error link
	external.openErrorReport = function() {
		window.open('/dataserver/error-report.html'); // do this instead of a regular link with target=_blank so we can use window.opener
	};


	external.errorReportData = function() {
		if(external.getCurrentModeObject().errorReportData) {
			return external.getCurrentModeObject().errorReportData();
		}
		else {
			return "";
		}
	};





	// return URL based on current map state
	function encodeURL() {
		// get URL query string with state of current mode
		var queryString = $.param(external.getCurrentModeObject().getURLParams());
		
		// get current URL without query string
		var baseURL = window.location.href.split("?")[0];

		return baseURL + "?" + queryString;
	}
	


	// update browser URL on "mapstateChange" event
	$("body").on("mapstatechange", function() {
		if (typeof history.pushState === "function") {
			history.pushState("", "", encodeURL());
		}
	});


	
	// This function to decode the current map state and set the URL is called 
	// once the bentity polygons are loaded.
	function decodeURL() {
		// get querystring, replace + with spaces
		var queryString = window.location.search.substring(1).replace(/\+/g, " ");
		
		var params = {};
		$.each(queryString.split("&"), function(i,pair) {
			var param = pair.split("=");
			if (param.length == 2) {
				params[decodeURIComponent(param[0])] = decodeURIComponent(param[1]);
			}
		});
		
		
		// activate mode if it's given in the url (or use default mode)
		var mode = modeURLCodes[params.mode] || external.getCurrentModeName();
		external.setMode(mode);
		external.getCurrentModeObject().decodeURLParams(params);
		
	}

	$(window).on("popstate", decodeURL); // decode URL on back-button click


	return external;
})();


$(document).ready(function() {
	controls.hideEntryText();
});

