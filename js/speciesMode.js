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
//	Internal Functions: getSelectedSpecies, 
//////////////////////////////////////////////////////////////////////////


var speciesMode = (function() {
	var external = {};


	var categoryCodes = ["N", "E", "I", "V", "D"]; // legend will be in this order
	var categoryColors = ["#009E73","#D55E00","#FF8897","#C695FF","#FFCEEC"];
	
	var categoryNames = {"N": "Native",
						 "I": "Indoor Introduced",
						 "E": "Exotic",
						 "V": "Needs Verification",
						 "D": "Dubious"
						 };
						 
	var pointColorsIndex =
						  {"categories":[
						 {"key":"N",
						 "value": "#1F7100"},
						 {"key":"I",
						 "value": "#7F2200"},
						 {"key":"E", 
						 "value":"#FF7941"},	
						 {"key":"V",
						  "value":"#8A41FF"},
						 {"key":"D", 
						 "value":"#AB42BA"}
						  ]};
	
	var noRecordsColor = "white";




	
	// the current data selected and mapped by the user	
	var mappedData = null;
	external.resetData = function() {
		mappedData = {
		speciesName: null, // current species name
		speciesCode: null, // current species code
		pointRecords: null, // current points to show, with {gabi_acc_number:xxx, lat:xxx, lon:xxx} for each
		bentityCategories: {}, // keys are bentity GID's, values are category codes
		genusName:null,
		subfamilyName:null,
		numRecordsPerBentity:{}, //keys are bentity ID, values are number of total records
		museumCountPerBentity:{}, //keys are bentity ID, values are number of museum records
		databaseCountPerBentity:{},//keys are bentity ID, values are number of database records
		literatureCountPerBentity:{} //keys are bentity ID, values are number of literature records
		}
	};
	external.resetData();
	
	
	

	// taxon_code is the key to send the server, speciesName is what to display to the user
	function getSelectBoxSpecies() {
			return { taxon_code:  $('#sppView-species-select').val(),
					 speciesName: $('#sppView-species-select option:selected').text() };
	}
	
	
	$('#sppView-species-select').change(function() {
		speciesMode.updateData();
		$('#species-autocomplete').val("");
	});
	
	
	// Re-draws all the points on the map
	// Called when the user updates the data, and when the map needs to be re-drawn 
	// (eg every time the user zooms)
	external.resetView = function() {
	
		
		
		if (mappedData.pointRecords) {
		
			var g = baseMap.getOverlayG();
	
			g.selectAll('.dot').remove(); // clear all dots
	
			  // plot dots
			  g.selectAll('.dot')
				.data(mappedData.pointRecords)
				.enter()
				.append('circle')
				.attr('class', 'dot')
				.attr('cx',function(d){
					return baseMap.getProjection()([d.lon,d.lat]).x;
				})
				.attr('cy',function(d){
					return baseMap.getProjection()([d.lon,d.lat]).y;
				})
				.attr("fill", function(d){
					//console.log(pointColorsIndex.categories);
					
					for (var i=0; i<pointColorsIndex.categories.length;i++){
						if(pointColorsIndex.categories[i].key==d.status){
							return pointColorsIndex.categories[i].value;
						}
					}
				})
				.attr('r',4)
				.on("click", function(d,i) {
					// label content for info panel when point is clicked
					var infoPanel = mapUtilities.openInfoPanel();
					
					infoPanel.html("<br><br><br>"
					+"<div class='total'>Total Records: "+ (d.num_records || "0") + "</div>"
					+"Geographic Coordinates<b>:<br>  ( "+d.lat+" , "+d.lon+" )</b><br>" 
					+ "<br>Museum Records: "+(d.museum_count || "0")
					+"&nbsp;&nbsp;&nbsp;&nbsp;Database Records: "+(d.database_count || "0")
					+"&nbsp;&nbsp;&nbsp;&nbsp;Literature Records: "+ (d.literature_count || "0"));
						
						
					// Fetch citations	
				    $.getJSON('/api/v01/citations.json', {species: mappedData.speciesCode, lat: d.lat, lon: d.lon  })
						.error(controls.whoopsNetworkError)
						.done(function(data) {
							//console.log(data);
							mapUtilities.appendCitations(infoPanel, data.records);
					});	
				})
				.on("mouseover", function(d, i) {
					var labelHTML = "<h4 class='text-center'>" + d.num_records + (d.num_records > 1 ? " records" : " record") + "</h4><br><b>(" + d.lat + "," + d.lon + ")</b>";
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
					.duration(1000)
					.style({
						'stroke-width':1,
						'stroke-opacity':1,
						'fill-opacity':1,
						'stroke':'none'
					});
				});
		
		}
	}
	


	
	// called when this mode is selected
	external.activateMode = function(updateURL) {
		// update URL if updateURL is passed and there's already data selected
		if (updateURL && mappedData.speciesCode) {
			$("body").trigger("mapstatechange");
		}
	
		choropleth();
		renderPoints();
		
	}
	
	
	// called to reset the map back to its original state, without any data
	// for this mode, so a different map mode can render the map
	external.deactivateMode = function() {
		baseMap.getOverlayG().selectAll('.dot').remove(); // clear all dots
		baseMap.resetChoropleth();
		baseMap.resetOverlappingBentities();
	}
	
	
	
	
	// called when the user selects a species from the species drop down or by typing in a species
	// speciesCode is optional, if not provided it will be looked up from select boxes
	// If provided, selectedSpp should contain {taxon_code:xxx, speciesName:xxx}
	external.updateData = function(selectedSpp) {
		
		// get selectedSpp from select box if it wasn't provided as an argument
		var selectedSpp = selectedSpp || getSelectBoxSpecies();
	
	
		if (!selectedSpp.taxon_code && !embeddedMode) {
			alert('Please select a species to map.');
			return;
		}	
	
		external.resetData();
		mappedData.speciesCode = selectedSpp.taxon_code;
		mappedData.speciesName = selectedSpp.speciesName;
		
		//console.log("mappedData.speciesName");
		//console.log(mappedData.speciesName);
	
		
		
		// show loading graphic
		$("#loading-message").show();
		
		$("body").trigger("mapstatechange"); // fire event to update URL	
		
		
		// get status for each bentity
		$.getJSON('/api/v01/species-range.json', {species: selectedSpp.taxon_code})
		.fail(controls.whoopsNetworkError)
		.done( function(data) {
		
			// make sure the user hasn't already selected a different species
			if (selectedSpp.taxon_code == mappedData.speciesCode) {
			
				if (data.bentities) {
				
					if (data.bentities.length==0 && !embeddedMode) { 
						alert('No data for this species!');
					};
				
				
					// switch representation of bentities from list to object
					for (var i = 0; i < data.bentities.length; i++) {
						var record = data.bentities[i];
						mappedData.bentityCategories[record.gid] = record.category;
						
						mappedData.numRecordsPerBentity[record.gid]=record.num_records;
						mappedData.literatureCountPerBentity[record.gid]=record.literature_count;
						mappedData.museumCountPerBentity[record.gid]=record.museum_count;
						mappedData.databaseCountPerBentity[record.gid]=record.database_count;
					}
					
				
				}
				
				if (controls.getCurrentModeName() == "speciesMode") { 
					// make sure the user hasn't switched to a different mode already
					
					
					//get genus name and subfamily name
					$.getJSON('/api/v01/antweb-links.json', {taxon_code: selectedSpp.taxon_code})
					.fail(controls.whoopsNetworkError)
					.done(function(data){
						
						// make sure the user hasn't already selected a different species
						if (selectedSpp.taxon_code == mappedData.speciesCode) {
							mappedData.genusName = data.taxonomy[0].genusName;
							mappedData.subfamilyName = data.taxonomy[0].subfamilyName;
						}
			
				
							choropleth();
			
		
			
					})
					.always( function() {
						$("#loading-message").hide();
					});
					
				
				}
				
			}
			
		})
		.always( function() {
			$("#loading-message").hide();
		});
		
		
		
		
		
		
		// get species points
		$.getJSON('/api/v01/species-points.json', {species: selectedSpp.taxon_code})
		.done(function(data) {
			
			// make sure the user hasn't already selected a different species
			if (selectedSpp.taxon_code == mappedData.speciesCode) {
			
				if (data.records) {
					mappedData.pointRecords = data.records;
				
					renderPoints();
				} 
			
			}
		})
		.fail(controls.whoopsNetworkError);
	};
	
	
	
	
	
	// SPECIES AUTOCOMPLETE BOX
	(function() {

		$('#species-autocomplete')		
		
		.val("") // clear value on page load (don't remember previously-entered value)
		
		// update data when a species is selected from the autocomplete box
		.autocomplete({
			minLength: 3, // wait for at least 3 characters
		
			// look up species list from server when the user starts typing
			source: function(request, response) {
				$.getJSON('/api/v01/species-search.json', {q: request.term})
				.done(function(data) {
					response(data.species);
				})
				.fail(function(data) {
					external.whoopsNetworkError();
					response([]);
				});
			}
		})

		// update data when an option is selected
		.on("autocompleteselect", function(event, ui) {
			external.updateData({taxon_code:ui.item.value, speciesName:ui.item.label});
		
			// fill the select box with the item's label instead of value (no periods)
			$(this).val(ui.item.label); //ui.item.label is the species name
			
			//$("sppView-species-select").val(mappedData.speciesName);
			return false;
		})
	
		// when the user focuses a list item without selecting it, show the label instead of value
		.on("autocompletefocus", function(event, ui) {
			$(this).val(ui.item.label);
			
			return false;
		})
	
		// do a search when the text box is clicked, if the text exceeds minlength
		.on("click", function() {
			if($(this).val().length >= $(this).autocomplete("option", "minLength")) {
				$(this).autocomplete("search");
			}
		});
	})();
	
	
	
	
	external.showViewWidgets = function(){
		$("#spp_view").css("display","inline");
		$('#view-title').html('Species Distribution');
		if(mappedData.speciesName==null){
			$("#antWeb").html("");
			$("#antWiki").html("");
			$("#see-on").html("");
			$("#antWeb").css("display","none");
 			$("#antWiki").css("display","none");
 			$("#see-on").css("display","none");
		}
	};
	

	
	
	
	// called once points are loaded
	function renderPoints() {
		external.resetView();
	}
	
	
	
	external.bentityInfoLabelHTML = function(d, i) {
		return "<h4 class='text-center'>"
			+ d.properties.bentity2_name + "</h4><br><b>"
			+ (categoryNames[mappedData.bentityCategories[d.properties.gid]] || "No records for this species") + "</b>";
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
		
		// set map title
		var speciesName = mappedData.speciesName;
		var currentModeTitle = "Species";
		mapUtilities.setTitle(currentModeTitle,speciesName);
		
		// any data to map?
		if (!$.isEmptyObject(mappedData.bentityCategories)) {
		
			baseMap.resetOverlappingBentities();
		
			var colorScale = d3.scale.ordinal().domain(categoryCodes).range(categoryColors);
		
			// return a color based on the category for the given bentity D3-bound data	
			var bentityColor = function(d) {
				if (mappedData.bentityCategories[d.properties.gid]) {
					return colorScale(mappedData.bentityCategories[d.properties.gid]);
				}
				else {
					return noRecordsColor;
				}
			};
			
			toggleOverlappingBentities();
			
			baseMap.choropleth(bentityColor);
			
			var currentModeTitle= "Species";
			mapUtilities.setLinks(currentModeTitle,mappedData.speciesName, mappedData.genusName,mappedData.subfamilyName);
			$("#antWeb").html("AntWeb");
 			$("#antWiki").html("AntWiki");
 			$("#see-on").html("See on: ");
			$("#antWeb").css("display","inline");
			$("#antWiki").css("display","inline");
			$("#see-on").css("display","inline");
			
			
			// Synchronize all species-selection controls with currently-mapped species
			controls.setSpeciesDropdowns(mappedData.subfamilyName, mappedData.genusName, mappedData.speciesCode);
			$('#species-autocomplete').val(mappedData.speciesName);
			
			
			drawLegend();
		}
		
		
	}
	
	
	
	
	// Check to see whether any of the overlapping bentities (India+Colombia) have data,
	// show them if they do.
	function toggleOverlappingBentities() {
		$.each(baseMap.overlappingBentities, function(bentityID, domIDs) {
			if (mappedData.bentityCategories[bentityID]) {
				baseMap.showOverlappingBentity(bentityID);
			}
		});

	}
	
	
	
	
	
	// Open info panel on bentity click
	external.bentityClickHandle = function(d, i) {
		if (!$.isEmptyObject(mappedData.bentityCategories)) {
			var infoPanel = mapUtilities.openInfoPanel();
			infoPanel.html("<h4>" + (mappedData.speciesName) + " in " + d.properties.bentity2_name + "</h4><br>"
		// 	+"<a href='about.html#dataAvailabilityAbout'><div id='data-availability' class='hvr-shrink'>Data Access</div></a>"
			+"<div class='total'>Total Records: "+ (mappedData.numRecordsPerBentity[d.properties.gid]|| "0")
			+ "</div> <br>Museum Records: "+(mappedData.museumCountPerBentity[d.properties.gid]|| "0")
			+"&nbsp;&nbsp;&nbsp;&nbsp;Database Records: "+(mappedData.databaseCountPerBentity[d.properties.gid]|| "0")
			+"&nbsp;&nbsp;&nbsp;&nbsp;Literature Records: "+(mappedData.literatureCountPerBentity[d.properties.gid]|| "0"));
		}
		
		$.getJSON('/api/v01/citations.json', {species: mappedData.speciesCode, bentity_id: d.properties.gid })
			.error(controls.whoopsNetworkError)
			.done(function(data) {
				//console.log(data);
				mapUtilities.appendCitations(infoPanel, data.records);
			});	
		
	};
	
	
	
	

	function drawLegend() {
		var legendColors = categoryColors.concat([noRecordsColor]);
		
		var legendLabels = [];
		for (var i = 0; i < categoryCodes.length; i++) {
			legendLabels.push(categoryNames[categoryCodes[i]]);
		}
		legendLabels.push("No Records");
		
		mapUtilities.drawLegend(
			d3.select("#species-legend"),
			legendLabels,
			legendColors
		);
		$("#legendInfo").css("display","inline");
		
		
		
	}



	
	external.errorReportData = function() {
		return "Species distribution mode\nSelected species: " + (mappedData.speciesName || "none selected");
	}




	// URL parameters needed to serialize current state
	// WILL NEED TO CHANGE THIS if relationship between speciesCode and speciesName ever changes
	external.getURLParams = function() {
		if (mappedData.speciesCode) {
			return {mode:"species", species:mappedData.speciesCode}
		}
		
		else {
			return {};
		}
	}
	
	
	
	
	
	// Given URL query string parameters as an object, update data with the given species.
	// WILL NEED TO CHANGE THIS if relationship between speciesCode and speciesName ever changes
	external.decodeURLParams = function(params) {
		if (params.species) { // update data with given species code
			var taxon_code = params.species;
			var speciesName = taxon_code.replace(".", " "); // replace dots with spaces to get species name
			$("#species-autocomplete").val(speciesName); // put species name in autocomplete box
			external.updateData({taxon_code:taxon_code, speciesName:speciesName});
		}
		else { // no species provided
			external.updateData();
		}
	}
	
	
	
	
	
	return external;
})();
controls.registerModeObject("speciesMode", speciesMode);


