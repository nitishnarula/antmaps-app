/*
* Each mode needs to have the following external methods:
* activateMode() -- called when the user switches to this mode
* deactivateMode() -- called to clean up, when the user switches to a different mode
* updateData() -- called when the most specific select box is selected
* resetData() -- clear the currently-saved data for this mode
* resetView() -- called when the map has to be re-drawn, like on zoom
* bentityInfoLabelHTML(d, i) -- returns the info-label text for a bentity, given D3-bound data d and index i
*/





//////////////////////////////////////////////////////////////////////////
//  SPECIES MODE
//
//  Functionalities for species mode: gets data, gets current species, draws points,
//                                    recolors map, draws legend, resets mode 
//  External Functions: resetData, resetView, activateMode, deactivateMode, updateData,
//						bentityInfoLabelHTML, circleHighlight, choropleth
//	Internal Functions: getSelectedSpecies, renderChoropleth
//////////////////////////////////////////////////////////////////////////


var speciesMode = (function() {
	var external = {};


	var categoryCodes = ["N", "E", "I", "D", "V"]; // legend will be in this order
	var categoryColors = ["#F7E46D","#A7BD5B","#DC574E","#8DC7B8","#ED9355"];
	var categoryNames = {"N": "Native",
						 "I": "Indoor Introduced",
						 "E": "Exotic",
						 "D": "Dubious",
						 "V": "Needs Verification"};
	var notPresentColor = "white";


	// the current data selected and mapped by the user
	var currentData = null;
	external.resetData = function() {
		currentData = {
		'speciesName': null, // current species name
		'speciesCode': null, // current species code
		'pointRecords': null, // current points to show, with {gabi_acc_number:xxx, lat:xxx, lon:xxx} for each
		'bentityCategories': {} // keys are bentity GID's, values are category codes
		}
	};
	external.resetData();
	
	
	
	// taxon_code is the key to send the server,
	// speciesName is what to display to the user
	function getSelectedSpecies() {
		return { taxon_code:  $('#sppView-species-select').val(),
				 speciesName: $('#sppView-species-select option:selected').text() };
	}
	
	$('#sppView-species-select').change(function() {
		speciesMode.updateData();
	});
	
	$('#sppView-genus-select').change(function(){
		$('#querySpecies').css('margin-left',0);
	});
	
	$('#sppView-subfamily-select').change(function(){
		$('#querySpecies').css('margin-left',20);
	});
	
	
	// Re-draws all the points on the map
	// Called when the user updates the data, and when the map needs to be re-drawn 
	// (eg every time the user zooms)
	external.resetView = function() {
	
		
		
		if (currentData.pointRecords) {
		
			var g = baseMap.getOverlayG();
	
			g.selectAll('.dot').remove(); // clear all dots
	
			  // plot dots
			  g.selectAll('.dot')
				.data(currentData.pointRecords)
				.enter()
				.append('circle')
				.attr('class', 'dot')
				.attr('cx',function(d){
					return baseMap.getProjection()([d.lon,d.lat]).x;
				})
				.attr('cy',function(d){
					return baseMap.getProjection()([d.lon,d.lat]).y;
				})
				.attr("fill","#F05253")
				.attr('r',4)
				.on("click",mapUtilities.infoPanelPoints)
				.on("mouseover", function(d, i) {
					var labelHTML = "<h3 class='text-center'>" + d.gabi_acc_number + "</h3>";
					mapUtilities.infoLabel(d, "dot" + i, 0, labelHTML);
				})
				.on("mouseout", function(d,i) {
					mapUtilities.removeInfoLabel(d, "dot"+i);
				})
				.on("mouseover.border",function(){
					d3.select(this)
					.transition()
					.duration(1000)
					.style({
						'stroke-width':10,
						'stroke-opacity':0.3,
						'fill-opacity':1,
						'stroke':'white',
						'cursor':'pointer'
					});
				})
				.on("mouseout.border",function(){
					d3.select(this)
					.transition()
					.duration(2000)
					.style({
						'stroke-width':1,
						'stroke-opacity':1,
						'fill-opacity':1,
						'stroke':'#F05253'
					});
				});
		
		}
	}
	


	
	// called when this mode is selected
	external.activateMode = function() {
		renderChoropleth();
		renderPoints();
		
	}
	
	// called to reset the map back to its original state, without any data
	// for this mode, so a different map mode can render the map
	external.deactivateMode = function() {
		baseMap.getOverlayG().selectAll('.dot').remove(); // clear all dots
		baseMap.resetChoropleth();
	}
	
	
	
	
	// called when the user presses the "map" button
	external.updateData = function() {
		var selectedSpp = getSelectedSpecies();
	
	
		external.resetData();
		currentData.speciesCode = selectedSpp.taxon_code;
		currentData.speciesName = selectedSpp.speciesName;
	
	
		// check to make sure a species is selected
		if(!$("#sppView-subfamily-select").val()){
			alert('Please select a subfamily.');
			return;
		}
		
		if(!$("#sppView-genus-select").val()){
			alert('Please select a genus.');
			return;
		}
		
		if (!selectedSpp.taxon_code) {
			alert('Please select a species to map.');
			return;
		}
		
		// show loading graphic
		$("#loading-message").show();
		
		
		
		// get status for each bentity
		$.getJSON('/dataserver/species-bentity-categories', {taxon_code: selectedSpp.taxon_code})
		.fail(controls.whoopsNetworkError)
		.done( function(data) {
		
			// make sure the user hasn't already selected a different species
			if (selectedSpp.taxon_code == currentData.speciesCode) {
			
				if (data.bentities) {
				
					if (data.bentities.length==0) { 
						alert('No data for this species!');
					};
				
				
					// switch representation of bentities from list to object
					for (var i = 0; i < data.bentities.length; i++) {
						var record = data.bentities[i];
						currentData.bentityCategories[record.gid] = record.category;
					}
				
				}
				
				renderChoropleth();
				
			}
			
		})
		.always( function() {
			$("#loading-message").hide();
		});
		
		
		
		// get species points
		$.getJSON('/dataserver/species-points', {taxon_code: selectedSpp.taxon_code})
		.done(function(data) {
			
			// make sure the user hasn't already selected a different species
			if (selectedSpp.taxon_code == currentData.speciesCode) {
			
				if (data.records) {
					currentData.pointRecords = data.records;
				
					renderPoints();
				}
			
			}
		})
		.fail(controls.whoopsNetworkError);
	}
	
	
	
	//NEW
	external.showViewWidgets = function(){
		$("#spp_view").css("display","inline");
		$("#diversity_view").css("display","none");	
		$('#view-title').html('Species Distribution');
	}
	

	
	// render choropleth and set map title
	function renderChoropleth() {
	
		var speciesName = currentData.speciesName;
		var currentModeTitle = "Species";
		mapUtilities.setTitle(currentModeTitle,speciesName);
	
		
		choropleth();
	}
	
	
	// called once points are loaded
	function renderPoints() {
		external.resetView();
	}
	
	
	
	external.bentityInfoLabelHTML = function(d, i) {
		return "<h3 class='text-center'>"
			+ d.properties.bentity2_name + "</h3><br><b>"
			+ (categoryNames[currentData.bentityCategories[d.properties.gid]] || "") + "</b>";
	};
	
	

	
	
	external.circleHighlight = function(data){
				
		var labelAttribute = "<h3 class='text-center'>"+props.gabi_acc_number+"</h3>";
				
		var finalId = props.gabi_acc_number;
				
		var infolabel = d3.select("body").append("div")
					.attr("class", "infolabel") //for styling label
					.attr("id", finalId+"label") //for future access to label div
					.html(labelAttribute) //add text
					.append("div") //add child div for feature name
					.attr("class", "labelname"); //for styling name
	};
	

	
	
	// color regions on the map
	function choropleth() {
		
		if (!$.isEmptyObject(currentData.bentityCategories)) {
		
			var colorScale = d3.scale.ordinal().domain(categoryCodes).range(categoryColors);
		
			// return a color based on the category for the given bentity D3-bound data	
			var bentityColor = function(d) {
				if (currentData.bentityCategories[d.properties.gid]) {
					return colorScale(currentData.bentityCategories[d.properties.gid]);
				}
				else {
					return notPresentColor;
				}
			};
			
			baseMap.choropleth(bentityColor);
			drawLegend();
		}
		
		
		
	}
	

	function drawLegend() {
		var legendColors = categoryColors.concat([notPresentColor]);
		
		var legendLabels = [];
		for (var i = 0; i < categoryCodes.length; i++) {
			legendLabels.push(categoryNames[categoryCodes[i]]);
		}
		legendLabels.push("Not Present");
		
		mapUtilities.drawLegend(
			d3.select("#species-legend"),
			legendLabels,
			legendColors
		);
	}

	
	external.errorReportData = function() {
		return "Species distribution mode\nSelected species: " + (currentData.speciesName || "none selected");
	}

	return external;
})();
controls.registerModeObject("speciesMode", speciesMode);


