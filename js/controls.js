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
	var modes = ["speciesMode", "diversitySubfamilyMode", "diversityGenusMode", 
			"diversityBentityMode"];
	var currentMode = modes[0];// default is species mode



	// references to each of the mode objects.  This is filled in at the bottom
	// of this file, after the mode objects have been declared.  Keys are the modes in 'modes' variable
	external.modeObjects = {};  
	
	// called in each mode file
	external.registerModeObject = function(name, obj) {
		external.modeObjects[name] = obj;
	};
	
	
	
	// set the current mode
	external.setMode = function(modeName) {
		external.getCurrentModeObject().deactivateMode();
		currentMode = modeName;
		external.getCurrentModeObject().activateMode();
	}


	// get the current mode object
	external.getCurrentModeObject = function() {
		return external.modeObjects[currentMode];
	};

	
	//NEW...hides all view-specific widgets
	external.hideAllWidgets = function(){
		$('#view-title').html('');
		$("#spp_view").css("display","none");
		$("#diversity_view").css("display","none");	
		$("#diversity_subfamily").css("display","none");
		$("#diversity_genus").css("display","none");
		$("#diversity_bentity").css("display","none");
	};
	
	
	
	//NEW...called by each view button when clicked
	external.switchMode = function(mode){
		
		
		external.hideAllWidgets();
		
		if(mode=="speciesMode"){
			speciesMode.showViewWidgets();
			
			external.setMode(modes[0]);
			
			$(".button").removeClass("button-selected");
			$("#species-button").addClass("button-selected");
			
		}else if(mode=="diversitySubfamilyMode"){
			diversitySubfamilyMode.showViewWidgets();
			
			external.setMode(modes[1]);
			
			$(".button").removeClass("button-selected");
			$("#diveristy-subfamily-button").addClass("button-selected");
			
		}else if(mode=="diversityGenusMode"){
			diversityGenusMode.showViewWidgets();
			
			external.setMode(modes[2]);
			
			$(".button").removeClass("button-selected");
			$("#diveristy-genus-button").addClass("button-selected");
			
		}else if(mode=="diversityBentityMode"){
			diversityBentityMode.showViewWidgets();
			
			external.setMode(modes[3]);
			
			$(".button").removeClass("button-selected");
			$("#diveristy-bentity-button").addClass("button-selected");
		}
	
	};
	

	// Different Views Tooptip
	$("#species-button").hover(
		function(){
			$("#view-description").html("Select a species via the drop down menu after filtering by subfamily and genus, then click 'MAP' to map its distribution, see its status in a region, and retrieve information on individual records.");
		},function(){
			$("#view-description").html('');
	});
	
	$("#diveristy-subfamily-button").hover(
		function(){
			$("#view-description").html("Select a subfamily via the drop down menu, then click 'MAP' to map its diversity and retrieve a species list for each region.");
		},function(){
			$("#view-description").html('');
	});
	
	$("#diveristy-genus-button").hover(
		function(){
			$("#view-description").html("Select a genus via the drop down menu after filtering by subfamily, then click 'MAP' to map its diversity and retrieve a species list for each region.");
		},function(){
			$("#view-description").html('');
	});
	
	$("#diveristy-bentity-button").hover(
		function(){
			$("#view-description").html("Select a region, by clicking on the map or via the drop down menu and click on 'MAP', to visualize how its fauna is distributed across other regions. To map a different region click on 'MAP A DIFFERENT REGION'.");
		},function(){
			$("#view-description").html('');
	});
	

	// Taxon select boxes
	// Populate a given select box (jquery object) with the given data
	function fillSelectbox(JQselectbox, data) {
		for (var i = 0; i < data.length; i++) {
			$('<option/>', {text:data[i].display, value:data[i].key}).appendTo(JQselectbox);
		}
	}
	


	// Taxon select boxes
	// Disable sub-select boxes
	external.clearSelectbox = function() {
		var boxes = $('#sppView-genus-select, #sppView-species-select, #genusView-genus-select');
		boxes.prop('disabled', true);
	};
	


	// On page load, get list of subfamilies and fill subfamily select boxes
	$(document).ready(function() {
		$.getJSON('/dataserver/subfamily-list')
		.done(function(data) {
			var boxes = $('#genusView-subfamily-select, #subfamilyView-subfamily-select, #sppView-subfamily-select');
			boxes.html('<option value="">Select Subfamily</option>');
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
			$('#genusView-subfamily-select, #subfamilyView-subfamily-select, #sppView-subfamily-select')
				.val('')
				.trigger('change'); // resets related select boxes
	};
	
	
	

	// When the species-mode subfamily select box changes, populate species-mode genus select box
	$('#sppView-subfamily-select').change(function() {
		var selected = $(this).val();
		$('#sppView-species-select').html('<option value="">Select Species</option>').prop('disabled', 'disabled');
		if (selected) {
			var box = $('#sppView-genus-select');
			box.html('<option value="">Loading...</option>');
			box.prop('disabled', 'disabled');
			$.getJSON('/dataserver/genus-list', {subfamily: selected}, function(data) {
				box.html('<option value="">Select Genus</option>');
				fillSelectbox(box, data.genera);
				box.prop('disabled', false);
			})
			.fail(external.whoopsNetworkError);
		}
		else {
			$('#sppView-genus-select').html('<option value="">Select Genus</option>').prop('disabled', 'disabled');
		}
	});
	



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
	$('#genusView-subfamily-select').change(function() {
		var selected = $(this).val();
		if (selected) {
			var box = $('#genusView-genus-select');
			box.html('<option value="">Loading...</option>');
			box.prop('disabled', 'disabled');
			$.getJSON('/dataserver/genus-list', {subfamily: selected}, function(data) {
				box.html('<option value="">Select Genus</option>');
				fillSelectbox(box, data.genera);
				box.prop('disabled', false);
			})
			.fail(external.whoopsNetworkError);
		}
		else {
			$('#genusView-genus-select').html('<option value="">Select Genus</option>').prop('disabled', 'disabled');
		}
	});
	



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
		

		
		//then should set mode to species mode and activate mode
		controls.setMode("speciesMode");
			// then should switch the toggle button back
		$(".button-wrap").removeClass("button-active");
		$("#spp_view").css("display","inline");
		$("#diversity_view").css("display","none");
		$("#view-title").html("Species View");
		//$("#current-species").html("");
		$(".infopanel").css("display","none");
		//then should repopulate subfamily select boxes
		controls.resetSubFamilySelectors();	
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


	return external;
})();


$(document).ready(function() {
	controls.getCurrentModeObject().activateMode(); // activate the first mode
});

