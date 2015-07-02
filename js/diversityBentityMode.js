//////////////////////////////////////////////////////////////////////////
// DIVERSITY BENTITY MODE
//
//	External Functions: resetData, activateMode, deactivateMode, resetView 
//						updateData, bentityInfoLabelHTML, bentityClickHandle
//						selectBentityView,errorReportData,getURLParams,decodeURLParams
//	Internal Functions: getSelectedBentity, renderMap, choropleth
//////////////////////////////////////////////////////////////////////////

var diversityBentityMode = (function() {

			
	var external = {};
	
	var selectedBentityFill = '#00C3A9';
	
	var zeroColor = "#ffffff";
	var colorArray = ["#36486f","#3288bd","#abdda4","#e6f598","#fdae61","#d53e4f","#9e0142"];
	var legendColors = ["#ffffff","#36486f","#3288bd","#abdda4","#e6f598","#fdae61","#d53e4f","#9e0142"];

	
	
	
	
	// unlike other modes, selected bentity is in mappedData because you can set it
	// in more ways than just the select box
	var mappedData = null;
	external.resetData = function(){
		mappedData = {
			selectBentityView: true, // true if we're in the "select a bentity" mode (uncolored), false for regular choropleth
			mappedBentity: {  // bentity currently mapped
				key: null,    
				name: null    // name to display for currently-mapped bentity
			},
			sppPerBentity: {}, // keys are bentity ID, values are species count
			maxSpeciesCount: 0, // max number of species seen so far (for scale)
			numRecordsPerBentity:{},
			museumCountPerBentity:{},
			databaseCountPerBentity:{},
			literatureCountPerBentity:{}
		};
	};
	external.resetData();
	
	
	
	
	
	// update bentity selection in mappedData when select box is changed
	$('#bentityView-bentity-select').change(function() {
		diversityBentityMode.updateData();
		baseMap.zoomToBentity(mappedData.mappedBentity.key);	
	});
	
	
	
	
	function getSelectBoxBentity() { 
		return {key: $('#bentityView-bentity-select').val(),
				name: $('#bentityView-bentity-select option:selected').text()
			}
	}
	
	
	
	
	external.activateMode = function(updateURL){
		
		// if updateURL is passed and there is some data mapped, update URL
		if (updateURL && !mappedData.selectBentityView) {
			$("body").trigger("mapstatechange"); 
		}
			
		renderMap();
	};
	
	
	external.deactivateMode = function(){ baseMap.resetChoropleth(); };
	
	
	external.resetView = function(){}; // not needed for this mode
	
	
	
	
	
	
	// updates map data with current selection and draws map
	// selectedBentity argument is optional, if provided should have {key:xxx, name:xxx}
	external.updateData = function(selectedBentity) {
	
	
		// get selected bentity from select box if not provided
		var selectedBentity = selectedBentity || getSelectBoxBentity();
	
		// get selected bentity
		if (!selectedBentity.key) {
			//alert('Please select a region to map.');
			external.selectBentityView();
			return;
		}
		
		
		external.resetData();
		mappedData.mappedBentity = selectedBentity;
		
		
		$("#loading-message").show();
		
		$("body").trigger("mapstatechange"); // fire event to update URL	
		
		// console.log(mappedData.mappedBentity.name);
		
		//sync up drop down with bentity clicked
		$("#bentityView-bentity-select").val(mappedData.mappedBentity.key);
		
		// get data from web server
		$.getJSON('/dataserver/species-in-common', {bentity: mappedData.mappedBentity.key})
		.fail(controls.whoopsNetworkError)
		
		// when the data comes back from the server
		.done(function(data) {
	
		
			// make sure the user hasn't already selected another bentity
			if (selectedBentity.key != mappedData.mappedBentity.key) {
				return;
			}

			mappedData.selectBentityView = false;  // out of "select a bentity" view

			
			// populate sppPerBentity object with keys for bentity ID's and species count for value
			for (var i = 0; i < data.bentities.length; i++) {
				var record = data.bentities[i];
				
				// keep track of the highest species count we've seen so far (except for the selected bentity)
				if (record.species_count > mappedData.maxSpeciesCount 
								&& record.gid != mappedData.mappedBentity.key) {
					mappedData.maxSpeciesCount = record.species_count;
				}
				
				mappedData.sppPerBentity[record.gid] = record.species_count;
				
				// populate numRecordsPerBentity object with keys for bentity ID's and record count for value
				mappedData.numRecordsPerBentity[record.gid]=record.num_records;
				mappedData.museumCountPerBentity[record.gid]=record.museum_count;
				mappedData.databaseCountPerBentity[record.gid]=record.database_count;
				mappedData.literatureCountPerBentity[record.gid]=record.literature_count;
				
			}
			
			
			if (controls.getCurrentModeName() == "diversityBentityMode") { 
				// make sure the user hasn't switched to a different mode already
				renderMap();
			}
			
		
		})
		.always( function() {
			$("#loading-message").hide();
		});
		
		
	}
	

	external.showViewWidgets= function(){		
		
		$("#bentity_view").css("display","inline");
		$("#antWeb").css("display","none");
		$("#antWiki").css("display","none");
		$("#antWeb").html("");
		$("#antWiki").html("");
		
		
		if (!mappedData.selectBentityView) {
			$('select-bentity-button').show();
		}
	};
	
	
	// either draw choropleth or "select a bentity" mode, and show appropriate controls
	function renderMap() {
		var currentModeTitle = "Region";
		mapUtilities.setTitle(currentModeTitle,'');
		
		if (mappedData.selectBentityView) {
			$("#select-bentity-button").hide();
			$("#bentity-description").show();
			// $("#queryBentity").css("margin-top",20);
			$("#diversity-bentity-legend-title").hide();
			baseMap.resetChoropleth();
			baseMap.setHilightColor(selectedBentityFill);
		}
		else {
			$("#select-bentity-button").show();
			$("#bentity-description").hide();
			// $("#queryBentity").css("margin-top",80);
			$("#diversity-bentity-legend-title").show();
			choropleth();
		}
	};
	
	
	
	function choropleth() {
	
		var currentModeTitle = "Region";
		mapUtilities.setTitle(currentModeTitle, mappedData.mappedBentity.name);
	
		
		if (!$.isEmptyObject(mappedData.sppPerBentity)) {
		
			var colorScale = mapUtilities.logBinColorScale(mappedData.maxSpeciesCount, zeroColor, colorArray);
		
			// function called to determine color of each bentity, given d3-bound
			// data (d) for the bentity
			var bentityColor = function(d) {
				var color = null;
				if (d.properties.gid == mappedData.mappedBentity.key) {
					color = selectedBentityFill;
				}
				else if (mappedData.sppPerBentity[d.properties.gid]) {
					color = colorScale(mappedData.sppPerBentity[d.properties.gid]);
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
			if (mappedData.mappedBentity.name) { // alert if there's a bentity selected
				alert("No data for " + mappedData.mappedBentity.name + ".");
				external.selectBentityView();
			}
		}
	}
	
	
	
	
	
	
	external.bentityInfoLabelHTML = function(d, i) {
		var labelHTML = "<h4 class='text-center'>" 
		+ d.properties.bentity2_name + "</h4>";
		
		if (mappedData.selectBentityView) {
			labelHTML += "<br><b>Click to select</b>";
		}
		
		else {
			labelHTML += "<br><b>" + (mappedData.sppPerBentity[d.properties.gid] || "0")
		
			if (d.properties.gid == mappedData.mappedBentity.key) {
				labelHTML += " species in total</b>";
			}
			else {
				labelHTML += " native species also present in<br />" + mappedData.mappedBentity.name + "</b/>";
			}
		
		}
		return labelHTML;
	}
	
	
	
	
	
	// Select a bentity, or open an info panel with a list of species for this bentity+subfamily
	external.bentityClickHandle = function(d, i) {
		// if we're in "select a bentity" mode, select a bentity and update data
		if (mappedData.selectBentityView) { 
			mappedData.selectBentityView = false; // switch to choropleth view
			
			// select the clicked bentity
			external.updateData({key:d.properties.gid, name:d.properties.bentity2_name});
		}
		
		// if we're in regular choropleth mode, open popup panel
		else {
			if (!$.isEmptyObject(mappedData.sppPerBentity)) { // is there some data mapped?
				var infoPanel = mapUtilities.openInfoPanel();
			
				if (d.properties.bentity2_name == mappedData.mappedBentity.name) {
					// the user clicked on the selected bentity
					infoPanel.html("<h4>" + (mappedData.sppPerBentity[d.properties.gid] || "0") + " native species<br />for " + d.properties.bentity2_name + "</h4>");
				}
				
				else {
					// the user clicked a non-selected bentity
					infoPanel.html("<h4>" + (mappedData.sppPerBentity[d.properties.gid] || "0") + " native species in common<br />between " 
					+ d.properties.bentity2_name + " and " + mappedData.mappedBentity.name + "</h4>");
				
					infoPanel.append("div").classed("bentity-link-wrapper", true).append("a")
						.classed("map-this-bentity-link", true)
						.text("Map species present in " + d.properties.bentity2_name)
						.on("click", function() {
							mapUtilities.closeInfoPanel();
							controls.setMode("diversityBentityMode");
							controls.getCurrentModeObject().updateData({key:d.properties.gid, name:d.properties.bentity2_name});
						});
				
				}
				
				
				var loadingMessage=infoPanel.append("p").classed("loading", true).text("Loading...");
			
				// look up species list
				$.getJSON('/dataserver/species-list', {bentity: d.properties.gid, bentity2: mappedData.mappedBentity.key})
				.error(controls.whoopsNetworkError)
				.done(function(data) {
					loadingMessage.remove();
					mapUtilities.appendSpeciesList(infoPanel, data.species);
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
		return "Region comparison mode\nSelected region: " + (mappedData.mappedBentity.name || "none selected");
	}
	
	
	
	
	// get state parameters for URL data
	external.getURLParams = function() {
		
		if (mappedData.mappedBentity.key) {
			return {
				mode:"region",
				regionName: mappedData.mappedBentity.name,
				regionKey:  mappedData.mappedBentity.key
			};
		}
		
		else {
			return {};
		}
	}
	
	
	
	
	// load map from URL parameters
	external.decodeURLParams = function(params) {
		// update data if a bentity is provided
		if (params.regionKey && params.regionName) {
			external.updateData({key:params.regionKey, name:params.regionName});
		}
	}
	
	
	
	return external;
})();
controls.registerModeObject("diversityBentityMode", diversityBentityMode);



