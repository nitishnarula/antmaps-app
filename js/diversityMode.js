//////////////////////////////////////////////////////////////////////////
//  DIVERSITY MODE
//  External Functions: resetData, updateData, showViewWidgets, activateMode, 
//                      deactivateMode, resetView, bentityInfoLabelHTML, bentityClickHandle
//						errorReportData, getURLParams, decordeURLParams 
//	Internal Functions: getSelectBoxGenus, getSelectBoxSubfamily, choropleth 
//
//////////////////////////////////////////////////////////////////////////


var diversityMode = (function() {

	var zeroColor = "#ffffff";
 	var colorArray = ["#fef0d9","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#990000"];
    var legendColors = ["#ffffff","#fef0d9","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#990000"];
    	
	 //var colorArray =  ["#F9FB0E","#FABB43","#B1BE67","#52BD90","#08ABC1","#0661E1","#362B87"];
 	//var legendColors = ["#ffffff","#F9FB0E","#FABB43","#B1BE67","#52BD90","#08ABC1","#0661E1","#362B87"];
 	
	//var colorArray = ["#fee0d2","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#a50f15","#67000d"];
	//var legendColors=["#ffffff","#fee0d2","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#a50f15","#67000d"];
	
	var external = {};
	
	
	// key is the key to send to the web server,
	// name is what to show the user
	function getSelectBoxGenus() {
		return { key:  $('#diversityView-genus-select').val(),
			     name: $('#diversityView-genus-select option:selected').text() };
	}
	
	function getSelectBoxSubfamily() {
		return { key:  $('#diversityView-subfamily-select').val(),
				 name: $('#diversityView-subfamily-select option:selected').text() };
	}
	

	$('#diversityView-genus-select, #diversityView-subfamily-select').change(function() {
		external.updateData();
	});
	
	
	
	
	
	// keep track of the data we're looking at right now
	var mappedData = null;
	external.resetData = function() {
		mappedData = {
			genusName: null,      // name of the current genus
			genusKey: null,      // database key for the current genus
			subfamilyName: null,  // name of the current genus
			subfamilyKey: null,  // database key for the current genus
			sppPerBentity: {},    // keys are bentity ID, values are species count
			maxSpeciesCount: 0,    // maximum number of species for a bentity (for scale)
			numRecordsPerBentity:{}, //keys are bentity ID, values are number of total records
			museumCountPerBentity:{}, //keys are bentity ID, values are number of museum records
			databaseCountPerBentity:{},//keys are bentity ID, values are number of database records
			literatureCountPerBentity:{} //keys are bentity ID, values are number of literature records
			
		}
	}
	external.resetData();
	
	
	// Called when the user selects something, fetches data and draws the map.
	// selectedTaxon argument is optional, if provided should contain 
	// {selectedGenus: {name:xxx, key:xxx}, selectedSubfamily:{name:xxx, key:xxx}}
	// (selectedGenus.key and selectedSubfamily.key can be null to plot overall species richness)
	external.updateData = function(selectedTaxon) {
	
	
		// save selected genus and subfamily
		external.resetData();
		
		
		// update mapped data with selectedTaxon argument or select box values
		var selectedSubfamily = selectedTaxon ? selectedTaxon.selectedSubfamily : getSelectBoxSubfamily();
		var selectedGenus = selectedTaxon ? selectedTaxon.selectedGenus : getSelectBoxGenus();
		
		
		mappedData.genusName = selectedGenus.name;
		mappedData.genusKey = selectedGenus.key;
		mappedData.subfamilyName = selectedSubfamily.name;
		mappedData.subfamilyKey = selectedSubfamily.key;
		
		// For antweb links, when only genus is selected by user, get subfamily name
// 		if (mappedData.genusKey.length > 0 && mappedData.subfamilyKey.length == 0) {
// 			//console.log(mappedData)
// 			$.getJSON('/dataserver/antweb-links', {genus_name: selectedGenus.name})
// 			.fail(controls.whoopsNetworkError)
// 			.done(function(data){
// 				
// 				// make sure the user hasn't already selected a different genus
// 				if (mappedData.genusName == selectedGenus.name){
// 					mappedData.subfamilyName = data.taxonomy[0].subfamilyName;
// 				}
// 			
// 			})
// 			.always( function() {
// 				$("#loading-message").hide();
// 			});
// 		}
		//console.log(mappedData)
		
		$("#loading-message").show();

	
		$("body").trigger("mapstatechange"); // fire event to update URL	
	
		
		$.getJSON('/api/v01/species-per-bentity.json', 
			{genus: selectedGenus.key, subfamily:selectedSubfamily.key})
			
		// when the data comes back from the server
		.done(function(data) {	
		
			// make sure the user hasn't aready selected something else
			if (mappedData.subfamilyKey != selectedSubfamily.key ||
						mappedData.genusKey != selectedGenus.key)    {
				return;			
			}
			
			
			if (data.bentities.length==0 & !embeddedMode) { 
				alert('No data for this taxon!');
			};
			
			
 				
 				
 			
			
			
			for (var i = 0; i < data.bentities.length; i++) {
				var record = data.bentities[i];
								
				// keep track of the highest species count we've seen so far
				if (record.species_count > mappedData.maxSpeciesCount) {
					mappedData.maxSpeciesCount = record.species_count;
				}
				
				// populate mappedData.sppPerBentity with a key for each bentity, and value for species count
				mappedData.sppPerBentity[record.gid] = record.species_count;
				
				
				// populate mappedData.numRecordsPerBentity with a key for each bentity, 
				//and value for number of records
				mappedData.numRecordsPerBentity[record.gid]=record.num_records;
				mappedData.museumCountPerBentity[record.gid]=record.museum_count;
				mappedData.databaseCountPerBentity[record.gid]=record.database_count;
				mappedData.literatureCountPerBentity[record.gid]=record.literature_count;
				
			}
			
			
		
			
			// make sure the user hasn't switched to a different mode already
			if (controls.getCurrentModeName() == "diversityMode") {				
				choropleth();
			}
		})
		.always( function() {
			$("#loading-message").hide();
		})
		.fail(controls.whoopsNetworkError);
	};
	
	




	external.showViewWidgets= function(){
		$("#diversity_view").css("display","inline");
// 		if(mappedData.subfamilyKey != null){
// 			$("#antWeb").html("AntWeb");
//  			$("#antWiki").html("AntWiki");
//  		}
			
	}
	
	
	
	
	external.activateMode = function(updateURL){ 
	
		// load initial species richness data if the user hasn't selected anything
		if ($.isEmptyObject(mappedData.sppPerBentity) 
				&& !mappedData.genusKey 
				&& !mappedData.subfamilyKey) {
			external.updateData();		
		}
	
		if (updateURL) {
			$("body").trigger("mapstatechange"); // fire event to update URL
		}
	
		choropleth(); 
	};
	
	
	
	external.deactivateMode = function(){ baseMap.resetChoropleth(); };
	
	
	external.resetView = function(){};  // doesn't need to do anything for this mode



	// draw diversity-mode choropleth
	function choropleth(){
	
	
	
		if (mappedData.genusKey) {
		
			//console.log($("#diversityView-subfamily-select").val());
			
			var currentModeTitle = "Genus";
			mapUtilities.setTitle(currentModeTitle,mappedData.genusName);
			
				$("#antWeb").html("AntWeb");
				$("#antWiki").html("AntWiki");
				$("#see-on").html("See on: ");
				$("#antWeb").css("display","inline");
				$("#antWiki").css("display","inline");
				$("#see-on").css("display","inline");
			
			
			console.log($("#diversityView-subfamily-select option:selected").text());
			//to ensure the subfamily is selected first before passing it to mapUtilities.setLinks, 
			//otherwise the link for antweb would be broken since the subfamily would be All Subfamilies
			if($("#diversityView-subfamily-select option:selected").text()=="All Subfamilies"){
			//must look up the subfamily for the selected genus
			
				//var selectedGenusNew = $("#diversityView-subfamily-select").val();
				
				$.getJSON('/api/v01/antweb-links.json', {genus_name:mappedData.genusName})
				.error(controls.whoopsNetworkError)
				.done(function(data) {
					console.log(data.taxonomy[0].subfamilyName);
					mapUtilities.setLinks(currentModeTitle,null, mappedData.genusName,data.taxonomy[0].subfamilyName);
				});
				
			
			}else{
				
				mapUtilities.setLinks(currentModeTitle,null, mappedData.genusName,mappedData.subfamilyName);
				
 			
 			}
		}
		//if filter by subfamily
		else if (mappedData.subfamilyKey) {
			
			var currentModeTitle = "Subfamily";
			mapUtilities.setTitle(currentModeTitle,mappedData.subfamilyName);
			mapUtilities.setLinks(currentModeTitle,null, mappedData.genusName,mappedData.subfamilyName);
			$("#antWeb").html("AntWeb");
 			$("#antWiki").html("AntWiki");
 			$("#see-on").html("See on: ");
 			$("#antWeb").css("display","inline");
 			$("#antWiki").css("display","inline");
 			$("#see-on").css("display","inline");
		}
		//if no filter
		else {
			mapUtilities.setTitle('Overall Species Richness','');
			$("#antWeb").html("");
 			$("#antWiki").html("");
 			$("#see-on").html("");
 			$("#antWeb").css("display","none");
 			$("#antWiki").css("display","none");
 			$("#see-on").css("display","none");
		}
		

		
		
		
		
		// color map if there is data for this taxon
		if (!$.isEmptyObject(mappedData.sppPerBentity)) {
			
			var colorScale = mapUtilities.logBinColorScale(mappedData.maxSpeciesCount, zeroColor, colorArray);
			
			// function called to determine color of each bentity, given d3-bound
			// data (d) for the bentity
			var bentityColor = function(d) {
				var color = null;
				if (mappedData.sppPerBentity[d.properties.gid]) {
					color = colorScale(mappedData.sppPerBentity[d.properties.gid]);
				}
				else { 
					color = zeroColor; // 0 species
				}
				return color;
			};
			
			baseMap.choropleth(bentityColor);
			
			
			// draw legend
			$("#diversity-genus-legend-title").removeClass("none").addClass("inline");
			mapUtilities.drawLegend(
				d3.select("#diversity-genus-legend"),
				colorScale.binLabels(),
				legendColors
			);
		
			

		}
		else { // no data
			baseMap.resetChoropleth();
		}
	};
	
	
	
	
	
	//information on mouseover
	external.bentityInfoLabelHTML = function(d, i) {
		return "<h4 class='text-center'>" 
		+ d.properties.bentity2_name + "</h4><br><b>" 
		+ (mappedData.sppPerBentity[d.properties.gid] || "0") + " native species</b/>";
	}
	

	//information on click
	// Open an info panel with a list of species for this bentity+genus and metadata for the records
	external.bentityClickHandle = function(d, i) {
		if (!$.isEmptyObject(mappedData.sppPerBentity)) { // is there some data mapped?
			
		
				var infoPanel = mapUtilities.openInfoPanel();
		
				var speciesListParams; // parameters to look up species list
		
				
						
						if (mappedData.genusKey) { // if there's a genus mapped
					
							infoPanel.html("<h4>" + (mappedData.sppPerBentity[d.properties.gid] || "0") + 
							" native species for<br/>" + mappedData.genusName + " in " + d.properties.bentity2_name + "</h4>"
							+"<div class='total'>Total Records: "+ (mappedData.numRecordsPerBentity[d.properties.gid]|| "0")
							+"</div> <br>Museum Records: "+(mappedData.museumCountPerBentity[d.properties.gid]|| "0")
							+"&nbsp;&nbsp;&nbsp;&nbsp;Database Records: "+(mappedData.databaseCountPerBentity[d.properties.gid]|| "0")
							+"&nbsp;&nbsp;&nbsp;&nbsp;Literature Records: "+(mappedData.literatureCountPerBentity[d.properties.gid]|| "0"));
				
							speciesListParams = {bentity: d.properties.gid, genus: mappedData.genusKey};
						}
	
	
						else if (mappedData.subfamilyKey) { // if there's a subfamily mapped (but no genus)
							infoPanel.html("<h4>" + (mappedData.sppPerBentity[d.properties.gid] || "0") + 
							" native species for<br />" + mappedData.subfamilyName + " in " + d.properties.bentity2_name + "</h4>"
							+"<div class='total'>Total Records: "+ (mappedData.numRecordsPerBentity[d.properties.gid]|| "0")
							+"</div> <br>Museum Records: "+(mappedData.museumCountPerBentity[d.properties.gid]|| "0")
							+"&nbsp;&nbsp;&nbsp;&nbsp;Database Records: "+(mappedData.databaseCountPerBentity[d.properties.gid]|| "0")
							+"&nbsp;&nbsp;&nbsp;&nbsp;Literature Records: "+(mappedData.literatureCountPerBentity[d.properties.gid]|| "0"));
						}
	
	
						else { // no genus or subfamily
							infoPanel.html("<h4>" + (mappedData.sppPerBentity[d.properties.gid] || "0") + 
							" native species in " + d.properties.bentity2_name + "</h4>"
							+"<div class='total'>Total Records: "+ (mappedData.numRecordsPerBentity[d.properties.gid]|| "0")
							+"</div> <br>Museum Records: "+(mappedData.museumCountPerBentity[d.properties.gid]|| "0")
							+"&nbsp;&nbsp;&nbsp;&nbsp;Database Records: "+(mappedData.databaseCountPerBentity[d.properties.gid]|| "0")
							+"&nbsp;&nbsp;&nbsp;&nbsp;Literature Records: "+(mappedData.literatureCountPerBentity[d.properties.gid]|| "0"));
						} 
			
				

			
			var loadingMessage=infoPanel.append("p").text("Loading...");
			
			// look up species list
			$.getJSON('/api/v01/species.json', {bentity_id: d.properties.gid, genus: mappedData.genusKey, subfamily: mappedData.subfamilyKey})
			.error(controls.whoopsNetworkError)
			.done(function(data) {
				loadingMessage.remove();
				mapUtilities.appendSpeciesList(infoPanel, data.species);
			});
		}
	}



	
	external.errorReportData = function() {
		return "Diversity mode\nSelected subfamily: " + (mappedData.subfamilyKey || "none selected") 
			+" \nSelected genus: " + (mappedData.genusKey || "none selected");
	}
	
	
	
	
	// URL parameters needed to serialize current state
	// Ignore subfamily if genus is provided
	// WILL NEED TO CHANGE THIS if genusKey is ever no longer equal to genusName (and for subfamily)
	external.getURLParams = function() {
		if (mappedData.genusKey) {
			return {mode:"diversity", genus: mappedData.genusKey};
		}
		
		else if (mappedData.subfamilyKey) {
			return {mode:"diversity", subfamily: mappedData.subfamilyKey};
		}
		
		else {
			return {};
		}
	}
	
	
	
	
	// Update data based on URL parameters
	// Ignore subfamily if genus is provided.
	external.decodeURLParams = function(params) {
		// update subfamily or genus select box
		if (params.genus) {
			$("#diversityView-genus-select").val(params.genus);
			
			// is the genus list loaded yet?  If not try again once it is.
			if ($("#diversityView-genus-select").val() != params.genus) {
				$("#diversityView-genus-select").one("listupdate", function() {
					$("#diversityView-genus-select").val(params.genus);
				});	
				$("#diversityView-subfamily-select").val("").change(); // reset subfamily
			}
		}
		
		else if (params.subfamily) {
			$("#diversityView-subfamily-select").val(params.subfamily);
			$("#diversityView-genus-select").val("");
			
			// is the subfamily list loaded yet?  If not try again once it is.
			if ($("#diversityView-subfamily-select").val() != params.subfamily) {
				$("#diversityView-subfamily-select").one("listupdate", function() {
					$("#diversityView-subfamily-select").val(params.subfamily);
				});	
			}
		}
	
		else {
			$("#diversityView-subfamily-select").val("");
			$("#diversityView-genus-select").val("");
		}
	
		external.updateData({
			selectedGenus: {name: params.genus || "", key: params.genus || "" }, 
			selectedSubfamily:{name: params.subfamily || "", key: params.subfamily || ""} });
	}
	
	

	return external;
})();
controls.registerModeObject("diversityMode", diversityMode);



