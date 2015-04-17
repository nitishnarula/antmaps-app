//////////////////////////////////////////////////////////////////////////
//  DIVERSITY MODE
//
//////////////////////////////////////////////////////////////////////////


var diversityMode = (function() {

	var zeroColor = "#ffffff";
	var colorArray = ["#2166ac","#92c5de","#f4a582","#d6604d","#b2182b"];
	var legendColors = ["#ffffff","#2166ac","#92c5de","#f4a582","#d6604d","#b2182b"];
	
	var external = {};
	

	
	// key is the key to send to the web server,
	// name is what to show the user
	function getSelectedGenus() {
		return { key:  $('#diversityView-genus-select').val(),
			     name: $('#diversityView-genus-select option:selected').text() };
	}
	
	function getSelectedSubfamily() {
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
			maxSpeciesCount: 0    // maximum number of species for a bentity (for scale)
		}
	}
	external.resetData();




	external.updateData = function() {
	
		// save selected genus and subfamily
		external.resetData();
		
		var selectedSubfamily = getSelectedSubfamily();
		var selectedGenus = getSelectedGenus();
		
		mappedData.genusName = selectedGenus.name;
		mappedData.genusKey = selectedGenus.key;
		mappedData.subfamilyName = selectedSubfamily.name;
		mappedData.subfamilyKey = selectedSubfamily.key;
		
	
		$("#loading-message").show();
	
	
		
		$.getJSON('/dataserver/species-per-bentity', 
			{genus_name: selectedGenus.key, subfamily_name:selectedSubfamily.key})
			
		// when the data comes back from the server
		.done(function(data) {	
		
			// make sure the user hasn't aready selected something else
			if (mappedData.subfamilyKey != selectedSubfamily.key ||
						mappedData.genusKey != selectedGenus.key)    {
				return;			
			}
			
			
			if (data.bentities.length==0) { 
				alert('No data for this taxon!');
			};
			
			
			// populate mappedData.sppPerBentity with a key for each bentity, and value for species count
			for (var i = 0; i < data.bentities.length; i++) {
				var record = data.bentities[i];
								
				// keep track of the highest species count we've seen so far
				if (record.species_count > mappedData.maxSpeciesCount) {
					mappedData.maxSpeciesCount = record.species_count;
				}
				
				mappedData.sppPerBentity[record.gid] = record.species_count;
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
		$('#view-title').html('Diversity View');
			
	}
	
	
	
	
	external.activateMode = function(){ 
	
		// load initial species richness data if the user hasn't selected anything
		if ($.isEmptyObject(mappedData.sppPerBentity) 
				&& !mappedData.genusKey 
				&& !mappedData.subfamilyKey) {
			external.updateData();		
		}
		
		choropleth(); 
	};
	
	
	external.deactivateMode = function(){ baseMap.resetChoropleth(); };
	
	
	external.resetView = function(){};  // doesn't need to do anything for this mode



	// draw diversity-mode choropleth
	function choropleth(){

		// show map title
		if (mappedData.genusKey) {
			var currentModeTitle = "Genus";
			mapUtilities.setTitle(currentModeTitle,mappedData.genusName);
		}
		else if (mappedData.subfamilyKey) {
			var currentModeTitle = "Subfamily";
			mapUtilities.setTitle(currentModeTitle,mappedData.subfamilyName);
		}
		else {
			mapUtilities.setTitle('Overall Species Richness','');
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
	
	
	
	
	
	
	external.bentityInfoLabelHTML = function(d, i) {
		return "<h4 class='text-center'>" 
		+ d.properties.bentity2_name + "</h4><br><b>" 
		+ (mappedData.sppPerBentity[d.properties.gid] || "0") + " native species</b/>";
	}
	


	// Open an info panel with a list of species for this bentity+genus
	external.bentityClickHandle = function(d, i) {
		if (!$.isEmptyObject(mappedData.sppPerBentity)) { // is there some data mapped?
			var infoPanel = mapUtilities.openInfoPanel();
			
			var speciesListParams; // parameters to look up species list
			
			
			if (mappedData.genusKey) { // if there's a genus mapped
				infoPanel.html("<h4>" + (mappedData.sppPerBentity[d.properties.gid] || "0") + " native species for<br />" + mappedData.genusName + " in " + d.properties.bentity2_name + "</h4>");
				
				speciesListParams = {bentity: d.properties.gid, genus: mappedData.genusKey};
			}
			
			
			else if (mappedData.subfamilyKey) { // if there's a subfamily mapped (but no genus)
				infoPanel.html("<h4>" + (mappedData.sppPerBentity[d.properties.gid] || "0") + " native species for<br />" + mappedData.subfamilyName + " in " + d.properties.bentity2_name + "</h4>");
			}
			
			
			else { // no genus or subfamily
				infoPanel.html("<h4>" + (mappedData.sppPerBentity[d.properties.gid] || "0") + " native species in " + d.properties.bentity2_name + "</h4>");
			}
			
			
			// look up species list
			$.getJSON('/dataserver/species-list', {bentity: d.properties.gid, genus: mappedData.genusKey, subfamily: mappedData.subfamilyKey})
			.error(controls.whoopsNetworkError)
			.done(function(data) {
				var ul = infoPanel.append('ul');
						ul.selectAll('li')
				.data(data.species)
				.enter().append('li').text(function(d) {return d.display});
			});
		}
	}



	
	external.errorReportData = function() {
		return "Diversity mode\nSelected subfamily: " + (mappedData.subfamilyKey || "none selected") 
			+" \nSelected genus: " + (mappedData.genusKey || "none selected");
	}

	return external;
})();
controls.registerModeObject("diversityMode", diversityMode);



