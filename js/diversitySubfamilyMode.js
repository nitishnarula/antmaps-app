//////////////////////////////////////////////////////////////////////////
// DIVERSITY SUBFAMILY MODE
//
// External Functions: resetData, getCurrentData, updateData, activateMode,
//					   deactivateMode, resetView, bentityInfoLabelHTML,
//					   bentityClickHandle
// Internal Functions: getSelectedSubfamily, choropleth
//////////////////////////////////////////////////////////////////////////


var diversitySubfamilyMode = (function() {

	var zeroColor = "#ffffff";
	var colorArray = ["#2166ac","#92c5de","#f4a582","#d6604d","#b2182b"];
	var legendColors = ["#ffffff","#2166ac","#92c5de","#f4a582","#d6604d","#b2182b"];
	
	var external = {};
	
	
	
	
	// key is the key to send to the web server,
	// name is what to show the user
	function getSelectedSubfamily() {
		return { key:  $('#subfamilyView-subfamily-select').val(),
				 name: $('#subfamilyView-subfamily-select option:selected').text() };
	}
	
	
	
	
	// keep track of the data we're looking at right now
	var currentData = null;
	external.resetData = function() {
		currentData = {
			subfamilyName: null,  // name of the current subfamily
			sppPerBentity: {},    // keys are bentity ID, values are species count
			maxSpeciesCount: 0    // maximum number of species for a bentity (for scale)
		}
	}
	external.resetData();
	
	external.getCurrentData = function() { return currentData; }
	
	
	
	
	// called by "map" button
	external.updateData = function() {
		var selected = getSelectedSubfamily();
		
		
		
		external.resetData();
		var subfamilyName = selected.name;
		
	
		
		if (!selected.key) {
			alert('Please select a subfamily to map');
			return;
		}
		
		$("#loading-message").show();
		
		$.getJSON('/dataserver/species-per-bentity', {subfamily_name: selected.key})
		.done(function(data) {	

			external.resetData();
			currentData.subfamilyName = subfamilyName;
	
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
				//key = gid, value = species_count
			}
			
			external.resetView();
			choropleth();
		})
		.always( function() {
			$("#loading-message").hide();
		})
		.fail(controls.whoopsNetworkError);
		
	};
	
	
	//NEW
	external.showViewWidgets= function(){
			$("#spp_view").css("display","none");
			$("#diversity_view").css("display","inline");
			
			$('#view-title').html('Subfamily View');
			
			// toggle mode-specific controls
			$("#diversity_subfamily").css("display","inline");
			$("#diversity_genus").css("display","none");
			$("#diversity_bentity").css("display","none");
	}
	
	
	// draw choropeth when mode is activated
	external.activateMode = function(){
		choropleth();
	};
	
	
	
	
	external.resetView = function(){};  // this function doesn't need to do anything for this mode
	
	
	
	
	external.deactivateMode = function(){
		baseMap.resetChoropleth();
	};
	



	// draw diversity-mode choropleth
	function choropleth(){

		var genusName = currentData.subfamilyName;
		var currentModeTitle = "Subfamily";
		mapUtilities.setTitle(currentModeTitle,genusName);
		
	
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
			
			$("#diversity-subfamily-legend-title").removeClass("none").addClass("inline");
			
			mapUtilities.drawLegend(
				d3.select("#diversity-subfamily-legend"),
				colorScale.binLabels(),
				legendColors
			);
			
			
			// TODO put somewhere else
			baseMap.getBentities()
			.on("mouseover",external.highlight)
			.on("mouseout",external.dehighlight);
		}
		else { // no data
			baseMap.resetChoropleth();
		}
		
		
	};
	
	
	
	
	
	external.bentityInfoLabelHTML = function(d, i) {
		return "<h4 class='text-center'>" 
		+ d.properties.BENTITY + "</h4><br><b>" 
		+ (currentData.subfamilyName || "") + "</b><br><b>" 
		+ (currentData.sppPerBentity[d.properties.gid] || "0") + " species</b/>";
	};
	



	// can change here (don't touch other modes)
	// Open an info panel with a list of species for this bentity+subfamily
	//click without dragging
	external.bentityClickHandle = function(d, i) {
		if (!$.isEmptyObject(currentData.sppPerBentity)) { // is there some data mapped?
			var infoPanel = mapUtilities.openInfoPanel();
		

			infoPanel.html("<h4>" + (currentData.sppPerBentity[d.properties.gid] || "0") + " species for " + currentData.subfamilyName + " in " + d.properties.BENTITY + "</h4>");
		
			// look up species list
			$.getJSON('/dataserver/species-list', {bentity: d.properties.gid, subfamily: currentData.subfamilyName})
			.error(controls.whoopsNetworkError)
			.done(function(data) {
				var ul = infoPanel.append('ul');
			
				ul.selectAll('li')
				.data(data.species)
				.enter().append('li').text(function(d) {return d.display});
				//can add class or use .infopanel li
			});
		
		}
	};




	external.errorReportData = function() {
		return "Subfamily diversity mode\nSelected subfamily: " + (currentData.subfamilyName || "none selected");
	}
	
	return external;
})();
controls.registerModeObject("diversitySubfamilyMode", diversitySubfamilyMode);



