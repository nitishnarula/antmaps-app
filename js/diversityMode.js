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
	var currentData = null;
	external.resetData = function() {
		currentData = {
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
	
		external.resetData();
		
		var selectedSubfamily = getSelectedSubfamily();
		var selectedGenus = getSelectedGenus();
		
		currentData.genusName = selectedGenus.name;
		currentData.genusKey = selectedGenus.key;
		currentData.subfamilyName = selectedSubfamily.name;
		currentData.subfamilyKey = selectedSubfamily.key;
		
	
		
		
		$("#loading-message").show();
		
		$.getJSON('/dataserver/species-per-bentity', 
			{genus_name: selectedGenus.key, subfamily_name:selectedSubfamily.key})
		.done(function(data) {	
		
			// make sure the user hasn't aready selected something else
			if (currentData.subfamilyKey != selectedSubfamily.key ||
						currentData.genusKey != selectedGenus.key)    {
				return;			
			}
			
			
			if (data.bentities.length==0) { 
				alert('No data for this taxon!');
			};
			
			
			for (var i = 0; i < data.bentities.length; i++) {
				var record = data.bentities[i];
								
				// keep track of the highest species count we've seen so far
				if (record.species_count > currentData.maxSpeciesCount) {
					currentData.maxSpeciesCount = record.species_count;
				}
				
				currentData.sppPerBentity[record.gid] = record.species_count;
			}
			
			
			if (controls.getCurrentModeName() == "diversityMode") { 
				// make sure the user hasn't switched to a different mode already
				choropleth();
			}
		})
		.always( function() {
			$("#loading-message").hide();
		})
		.fail(controls.whoopsNetworkError);
	};
	
	
	//NEW
	external.showViewWidgets= function(){
		$("#diversity_view").css("display","inline");
		
		$('#view-title').html('Diversity View');
			
	}
	
	
	external.activateMode = function(){ 
	
		// load initial species richness data if the user hasn't selected anything
		if ($.isEmptyObject(currentData.sppPerBentity) 
				&& !currentData.genusKey 
				&& !currentData.subfamilyKey) {
			external.updateData();		
		}
		
		choropleth(); 
	};
	
	
	external.deactivateMode = function(){ baseMap.resetChoropleth(); };
	
	
	external.resetView = function(){};  // doesn't need to do anything for this mode



	// draw diversity-mode choropleth
	function choropleth(){

		if (currentData.genusKey) {
			var currentModeTitle = "Genus";
			mapUtilities.setTitle(currentModeTitle,currentData.genusName);
		}
		else if (currentData.subfamilyKey) {
			var currentModeTitle = "Subfamily";
			mapUtilities.setTitle(currentModeTitle,currentData.subfamilyName);
		}
		else {
			mapUtilities.setTitle('Overall Species Richness','');
		}
		
		
		if (!$.isEmptyObject(currentData.sppPerBentity)) {
			
			var colorScale = mapUtilities.logBinColorScale(currentData.maxSpeciesCount, zeroColor, colorArray);
			
			// function called to determine color of each bentity, given d3-bound
			// data (d) for the bentity
			var bentityColor = function(d) {
				var color = null;
				if (currentData.sppPerBentity[d.properties.gid]) {
					color = colorScale(currentData.sppPerBentity[d.properties.gid]);
				}
				else { 
					color = zeroColor; // 0 species
				}
				return color;
			};
			
			baseMap.choropleth(bentityColor);
			
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
		+ (currentData.genusName || "") + "</b><br><b>" 
		+ (currentData.sppPerBentity[d.properties.gid] || "0") + " native species</b/>";
	}
	


	// Open an info panel with a list of species for this bentity+genus
	external.bentityClickHandle = function(d, i) {
		if (!$.isEmptyObject(currentData.sppPerBentity)) { // is there some data mapped?
			var infoPanel = mapUtilities.openInfoPanel();
			
			infoPanel.html("<h4>" + (currentData.sppPerBentity[d.properties.gid] || "0") + " native species for<br />" + currentData.genusName + " in " + d.properties.bentity2_name + "</h4>");
			
			// look up species list
			$.getJSON('/dataserver/species-list', {bentity: d.properties.gid, genus: currentData.genusName})
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
		return "Genus mode\nSelected genus: " + (currentData.genusName || "none selected");
	}

	return external;
})();
controls.registerModeObject("diversityMode", diversityMode);



