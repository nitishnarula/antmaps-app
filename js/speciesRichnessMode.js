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
//  TOTAL SPECIES RICHNESS MODE
//////////////////////////////////////////////////////////////////////////

var speciesRichnessMode = (function() {
	var external = {};
	
	var zeroColor = "#ffffff";
	var colorArray = ["#2166ac","#92c5de","#f4a582","#d6604d","#b2182b"];
	var legendColors = ["#ffffff","#2166ac","#92c5de","#f4a582","#d6604d","#b2182b"];
	
	//how many species on mouseover
	//what species on click
	
	//how many spp for each bentity, store in currentData
	
	var currentData = null;
	
	// null vs {} ?
	
	external.resetData = function() {
		currentData = {
			selectedBentity: {// bentity selected in controls (may be different than currently-mapped bentity)
				key: null,    // key to send to the server
				name: null    // name to show the user
			},
			sppPerBentity: {}   // keys are bentity ID, values are species count
		}
	}
	external.resetData();
	
	external.getCurrentData = function() { return currentData; }
	
	external.resetView = function(){};  // doesn't need to do anything for this mode (doesn't for all modes but species mode)
	
	external.showViewWidgets= function(){
			$("#spp_view").css("display","none");
			$("#diversity_view").css("display","none");
			
			$('#view-title').html('Total Species Richness');
			
			// toggle mode-specific controls
			$("#diversity_subfamily").css("display","none");
			$("#diversity_genus").css("display","none");
			$("#diversity_bentity").css("display","none");
	}
	
	
	// draw choropeth when mode is activated
	external.activateMode = function(){
		choropleth();
	};
	
	
	external.deactivateMode = function(){
		baseMap.resetChoropleth();
	};
	
	external.showViewWidgets= function(){
		$('#view-title').html('Species Richness');
	};
	


	// draw  choropleth
	function choropleth(){
		
		var regionName = ''; // currentData.selectedBentity.name;
		var currentModeTitle = "Region";
		mapUtilities.setTitle(currentModeTitle,regionName);
	
	};
	
	
	
	//why currentData.sppPerBentity[d.properties.gid]?	
	
	external.bentityInfoLabelHTML = function(d, i) {
		return "<h4 class='text-center'>" 
		+ d.properties.BENTITY + "</h4><br><b>" 
		+ (currentData.sppPerBentity[d.properties.gid] || "0") + " species</b/>";
	}
	


	// Open an info panel with a list of species for this bentity+genus
	external.bentityClickHandle = function(d, i) {
		if (!$.isEmptyObject(currentData.sppPerBentity)) { // is there some data mapped?
			var infoPanel = mapUtilities.openInfoPanel();
			
			infoPanel.html("<h4>" + (currentData.sppPerBentity[d.properties.gid] || "0") + " species in " + d.properties.BENTITY + "</h4>");
			
			// look up species list
			$.getJSON('/dataserver/species-list', {bentity: d.properties.gid})
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
		return "Total species richness mode\nSelected region: " + (currentData.selectedBentity.name || "none selected");
	}

	return external;
})();


controls.registerModeObject("speciesRichnessMode", speciesRichnessMode);