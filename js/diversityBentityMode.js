//////////////////////////////////////////////////////////////////////////
// DIVERSITY BENTITY MODE
//
//	External Functions: resetData, activateMode, deactivateMode, resetView 
//						updateData, bentityInfoLabelHTML, bentityClickHandle
//						selectBentityView
//	Internal Functions: resetMappedData, getSelectedBentity, renderMap
//						choropleth, 
//////////////////////////////////////////////////////////////////////////

var diversityBentityMode = (function() {

			
	var external = {};
	
	var selectedBentityFill = '#00ADA7';
	
	var zeroColor = "#ffffff";
	var colorArray = ["#fcbba1","#fc9272","#fb6a4a","#de2d26","#a50f15"];
	var legendColors = ["#ffffff","#fcbba1","#fc9272","#fb6a4a","#de2d26","#a50f15"];
	
	
	
	
	// unlike other modes, selected bentity is in currentData because you can set it
	// in more ways than just the select box
	var currentData = null;
	external.resetData = function(){
		currentData = {
			selectBentityView: true, // true if we're in the "select a bentity" mode (uncolored), false for regular choropleth
			selectedBentity: {// bentity selected in controls (may be different than currently-mapped bentity)
				key: null,    // key to send to the server
				name: null    // name to show the user
			},
			mappedBentity: {  // bentity currently mapped
				key: null,    
				name: null    // name to display for currently-mapped bentity
			},
			sppPerBentity: {}, // keys are bentity ID, values are species count
			maxSpeciesCount: 0 // max number of species seen so far (for scale)
		};
	};
	external.resetData();
	
	

	
	
	// reset data that is used to color the map, but keep selection
	function resetMappedData() {
		var selectedBentity = currentData.selectedBentity;
		var selectBentityView = currentData.selectBentityView;
		
		external.resetData();
		
		currentData.selectedBentity = selectedBentity;
		currentData.selectBentityView = selectBentityView;
	}
	
	
	
	
	// update bentity selection in currentData when select box is changed
	$('#bentityView-bentity-select').change(function() {
		currentData.selectedBentity.key  = $('#bentityView-bentity-select').val();
		currentData.selectedBentity.name = $('#bentityView-bentity-select option:selected').text();
		diversityBentityMode.updateData();
// 		$('#select-bentity-button').removeClass('pulse');
// 		$('#select-bentity-button').addClass('pulse');
	});
	
	function getSelectedBentity() { return currentData.selectedBentity; }
	
	
	
	
	
	
	external.activateMode = function(){ renderMap(); };
	external.deactivateMode = function(){ baseMap.resetChoropleth(); };
	
	
	external.resetView = function(){}; // not needed for this mode
	
	
	
	
	
	
	// updates map data with current selection and draws map
	external.updateData = function() {
	
		if (!getSelectedBentity().key) {
			alert('Please select a region to map.');
			external.selectBentityView();
			return;
		}
		
		resetMappedData();
		var selectedBentity = getSelectedBentity();

		
		$("#loading-message").show();
		
		$.getJSON('/dataserver/species-in-common', {bentity: getSelectedBentity().key})
		.fail(controls.whoopsNetworkError)
		.done(function(data) {
		
			resetMappedData();
			currentData.mappedBentity = selectedBentity;
			currentData.selectBentityView = false;  // out of "select a bentity" view

			
			for (var i = 0; i < data.bentities.length; i++) {
				var record = data.bentities[i];
				
				// keep track of the highest species count we've seen so far (except for the selected bentity)
				if (record.species_count > currentData.maxSpeciesCount 
								&& record.gid != currentData.mappedBentity.key) {
					currentData.maxSpeciesCount = record.species_count;
				}
				
				currentData.sppPerBentity[record.gid] = record.species_count;
				//key = gid, value = species_count
			}
			
			renderMap();
			
		
		})
		.always( function() {
			$("#loading-message").hide();
		});
		
		
	}
	
	//NEW
	external.showViewWidgets= function(){		
		$("#diversity_subfamily").css("display","none");
		$("#diversity_genus").css("display","none");
		$("#diversity_bentity").css("display","inline");
		
		$("#spp_view").css("display","none");
		$("#diversity_view").css("display","inline");
		
		$('#view-title').html('Region Comparison');
		
		
		if (!currentData.selectBentityView) {
			$('select-bentity-button').show();
		}
	};
	
	
	// either draw choropleth or "select a bentity" mode, and show appropriate controls
	function renderMap() {
		var currentModeTitle = "Region";
		mapUtilities.setTitle(currentModeTitle,'');
		
		if (currentData.selectBentityView) {
			$("#select-bentity-button").hide();
			$("#bentity-description").show();
			$("#queryBentity").css("margin-top",20);
			$("#diversity-bentity-legend-title").hide();
			baseMap.resetChoropleth();
			baseMap.setHilightColor(selectedBentityFill);
		}
		else {
			$("#select-bentity-button").show();
			$("#bentity-description").hide();
			$("#queryBentity").css("margin-top",80);
			$("#diversity-bentity-legend-title").show();
			choropleth();
		}
	};
	
	
	
	function choropleth() {
		var selectedBentity = getSelectedBentity();
	
		var currentModeTitle = "Region";
		mapUtilities.setTitle(currentModeTitle,selectedBentity.name);
	
	
		if (!$.isEmptyObject(currentData.sppPerBentity)) {
		
			var colorScale = mapUtilities.logBinColorScale(currentData.maxSpeciesCount, zeroColor, colorArray);
		
			// function called to determine color of each bentity, given d3-bound
			// data (d) for the bentity
			var bentityColor = function(d) {
				var color = null;
				if (d.properties.gid == currentData.mappedBentity.key) {
					color = selectedBentityFill;
				}
				else if (currentData.sppPerBentity[d.properties.gid]) {
					color = colorScale(currentData.sppPerBentity[d.properties.gid]);
				}
				else { 
					color = zeroColor; // 0 species
				}
				return color;
			};
			
			$("#diversity-bentity-legend-title").removeClass("none").addClass("inline");
			
			baseMap.choropleth(bentityColor);
			mapUtilities.drawLegend(
				d3.select("#diversity-bentity-legend"),
				colorScale.binLabels(),
				legendColors
			);
			
		}
		else { // no data
			baseMap.resetChoropleth();
			if (getSelectedBentity().name) { // alert if there's a bentity selected
				alert("No data with overlapping species for " + getSelectedBentity().name + ".");
				external.selectBentityView();
			}
		}
	}
	
	
	
	
	
	
	external.bentityInfoLabelHTML = function(d, i) {
		var labelHTML = "<h4 class='text-center'>" 
		+ d.properties.bentity2_name + "</h4>";
		
		if (!currentData.selectBentityView) {
			labelHTML += "<br><b>" + (currentData.sppPerBentity[d.properties.gid] || "0")
		
			if (d.properties.gid == currentData.mappedBentity.key) {
				labelHTML += " species in total</b>";
			}
			else {
				labelHTML += " native species in common with<br />" + currentData.mappedBentity.name + "</b/>";
			}
		
		}
		return labelHTML;
	}
	
	
	
	
	
	// Select a bentity, or open an info panel with a list of species for this bentity+subfamily
	external.bentityClickHandle = function(d, i) {
		// if we're in "select a bentity" mode, select a bentity and update data
		if (currentData.selectBentityView) { 
			currentData.selectBentityView = false; // switch to choropleth view
			
			// select the clicked bentity
			currentData.selectedBentity.key = d.properties.gid;
			currentData.selectedBentity.name = d.properties.bentity2_name;
			external.updateData();
		}
		
		// if we're in regular choropleth mode, open popup panel
		else {
			if (!$.isEmptyObject(currentData.sppPerBentity)) { // is there some data mapped?
				var infoPanel = mapUtilities.openInfoPanel();
			
				if (d.properties.bentity2_name == currentData.mappedBentity.name) {
					// the user clicked on the selected bentity
					infoPanel.html("<h4>" + (currentData.sppPerBentity[d.properties.gid] || "0") + " native species<br />for " + d.properties.bentity2_name + "</h4>");
				}
				else {
					// the user clicked a non-selected bentity
					infoPanel.html("<h4>" + (currentData.sppPerBentity[d.properties.gid] || "0") + " native species in common<br />between " + d.properties.bentity2_name + " and " + currentData.mappedBentity.name + "</h4>");
				}
			
				// look up species list
				$.getJSON('/dataserver/species-list', {bentity: d.properties.gid, bentity2: currentData.mappedBentity.key})
				.error(controls.whoopsNetworkError)
				.done(function(data) {
					var ul = infoPanel.append('ul');
						ul.selectAll('li')
					.data(data.species)
					.enter().append('li').text(function(d) {return d.display});
				});
			}
		}
	}
	
	
	
	
	// switch to "select a bentity" view
	external.selectBentityView = function() {
		external.resetData();
		renderMap();
	};
	

	
	
	external.errorReportData = function() {
		return "Region comparison mode\nSelected region: " + (currentData.mappedBentity.name || "none selected");
	}
	
	return external;
})();
controls.registerModeObject("diversityBentityMode", diversityBentityMode);



