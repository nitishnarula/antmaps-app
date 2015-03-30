//////////////////////////////////////////////////////////////////////////
// Error Message
//////////////////////////////////////////////////////////////////////////

function whoopsNetworkError() {
	alert('Whoops!  Something went wrong.  Please check your internet connection and try again, or refresh the page.');
}






//////////////////////////////////////////////////////////////////////////
//  CONTROLS
//
//  Controls: Switch modes & fill select boxes
//  Included functions: fillSelectbox,
//					    getCurrentModeObject, setCurrentModeObject
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

	
	


	// switch between species and 3-diversity modes when toggle button is clicked
	$('.button-wrap').on("click", function(){
	
		$(this).toggleClass('button-active');  // toggle button 
		
		// swap title
		$('#view-title').html($('#view-title').text() == 
			'Diversity View' ? 'Species View' : 'Diversity View');
		
		// button-active == diversity views
		if($('.button-wrap').hasClass("button-active")){
		
			$("#spp_view").css("display","none");
			$("#diversity_view").css("display","inline");
		
			//to make the subfamily tab default and always the one active when switching views
			$(".diversity-button").removeClass("diversity-active");
			$("#diveristy-subfamily-button").addClass("diversity-active");		
		
			$("#diversity_subfamily").css("display","inline");
			$("#diversity_genus").css("display","none");
			$("#diversity_bentity").css("display","none");
			
			external.setMode(modes[1])
		
			
		}else{
		
		$("#spp_view").css("display","inline");
		$("#diversity_view").css("display","none");
		
		
		external.getCurrentModeObject().deactivateMode();
		currentMode = modes[0];
		external.getCurrentModeObject().activateMode();
		
	}
	
	});	




	//diversity view 3-mode toggle		
	$(".diversity-button").on("click",function(){
	
		// toggles button display 
		$(".diversity-button").removeClass("diversity-active");
		$(this).addClass("diversity-active");
		
	
		if($("#diveristy-subfamily-button").hasClass("diversity-active")){

			// toggle mode-specific controls
			$("#diversity_subfamily").css("display","inline");
			$("#diversity_genus").css("display","none");
			$("#diversity_bentity").css("display","none");
	
			external.setMode(modes[1])

		} 
		else if($("#diveristy-genus-button").hasClass("diversity-active")){

			$("#diversity_subfamily").css("display","none");
			$("#diversity_genus").css("display","inline");
			$("#diversity_bentity").css("display","none");
	
			external.setMode(modes[2])

		}
		else if($("#diveristy-bentity-button").hasClass("diversity-active")){
	
			$("#diversity_subfamily").css("display","none");
			$("#diversity_genus").css("display","none");
			$("#diversity_bentity").css("display","inline");
			
			external.setMode(modes[3])

		}
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
		.fail(whoopsNetworkError);
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
		.fail(whoopsNetworkError);
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
			.fail(whoopsNetworkError);
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
			.fail(whoopsNetworkError);
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
			.fail(whoopsNetworkError);
		}
		else {
			$('#genusView-genus-select').html('<option value="">Select Genus</option>').prop('disabled', 'disabled');
		}
	});
	


	
	return external;
})();








///////////////////////////////////////////////////////////////////////////////
// BASE MAP
//
// Draw base map: set width and height, add tile with leaflet
// draw polygons with D3 after loading json file
// define projection in leaflet + D3 and function to reset zoom
// Included functions: projectPoint, projectPoint180, reset, getProjection,
//					   getOverlayG,
///////////////////////////////////////////////////////////////////////////////

var baseMap = (function() {
	var external = {}; // methods and variables to return and expose externally
	
	
	
	// bentity topoJSON objects
	external.bentities = null;
	
	
	
	
	// set up Leaflet map, "map" is the leaflet map object
	var map = function() {
	
		// map width and height in pixels
		var width = $("#mapContainer").parent().width();
		var height= 800;
	
		// set width and height of Leaflet map div
		$("#mapContainer").css({'height':height, 'width':width})

		var map = new L.Map("mapContainer", {
			center: [37.8, 0], 
			zoom: 2,
			minZoom: 2
		});
	
		return map;
	}();
		

	
	// add tile layers and layer control to Leaflet map	
	(function() {	
	
		var tile1 = L.tileLayer('http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png', {
					attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					}),
		tile2 = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', {
					attribution: 'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS'
					}),
		tile3 = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
					attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
					});
		
		tile1.addTo(map);
	
		
		// layer control
		var layerControlItems = {
		  "<div class='layer-titles'> OSM Landscape </div>": tile1,
		  "<div class='layer-titles'> Terrain </div>": tile2,
		  "<div class='layer-titles'> Shaded Relief </div>":tile3
		};
		L.control.layers(layerControlItems).addTo(map);

	})();
	
	
	
	
	
	// Keep track of event listners to be bound to bentities.
	// This is necessary because we'll be periodically removing and re-creating bentities,
	// and will need to re-bind event listners each time.
	var bentityEventListners = []; // list of [event-type, event-handler] sub-lists
	
	
	external.addBentityEventListner = function(eventType, eventHandler) {
		external.getBentities().on(eventType, eventHandler);
		bentityEventListners.push([eventType, eventHandler]);
	}
	
	
	// Bind event listners to bentities.  Call this function every time bentities are re-created.
	function bindBentityListners() {
		var bentities = external.getBentities();
		for (var i = 0; i < bentityEventListners.length; i++) {
			bentities.on(bentityEventListners[i][0], bentityEventListners[i][1]);
		}
	}
	
	
	
	
	// overlayPane = Pane for overlays like polylines and polygons.
	// the SVG element is initialized with no width or height; the dimensions must be set dynamically because they change on zoom
	var svg = d3.select(map.getPanes().overlayPane).append("svg"),
		g = svg.append("g").attr("class", "leaflet-zoom-hide");
	//The leaflet-zoom-hide class is needed so that the overlay is hidden during Leaflet’s zoom animation
	



	// Return D3 selection with bentity polygons
	external.getBentities = function() {
		return g.selectAll("path.bentities");
	};






	// Custom "nondragclick" event on the map, that will fire if the user clicks
	// the map without dragging/panning it.  (to open info panel)
	(function() {
		var dragStarted = false; // whether this click is a drag
			
		map.on("mousedown", function(e) {
			dragStarted = false;	
		});
			
		map.on("dragstart", function(e) {
			dragStarted = true;
		});
			
		d3.select(map.getContainer()).on("mouseup", function() {
			if (!dragStarted) {
				// fire "nondragclick" event if the user clicked the map but isn't dragging
				var event = document.createEvent("UIEvents");
				event.initUIEvent("nondragclick", true, true, window, 1);
				d3.event.target.dispatchEvent(event);
			}
		});
	})();






	// D3/Leaflet projection for drawing bentities
	// latLngToLayerPoint: Returns the map layer point that corresponds to the given geographical coordinates (useful for placing overlays on the map).
	function projectPoint(x, y) {
		var point = map.latLngToLayerPoint(new L.LatLng(y, x)); //L.latLng(point1, point2): Represents a geographical point with a certain latitude and longitude
		this.stream.point(point.x, point.y); // this.stream.point is a D3 thing
		//d3.geo.transform creates a new stream transform using the specified hash of methods
		//To access the wrapped stream within a method, use this.stream
	}
	var transform = d3.geo.transform({point: projectPoint}), //there are no arguments passed to projectPoint(?)
		path = d3.geo.path().projection(transform);
	





	// projection to use for Russia and Fiji bentities, accross the 180th meridian
	// subtract 30 degrees from longitude, then project, then move back by 30 degrees projected
	function projectPoint180(x, y) {
		var point = map.latLngToLayerPoint(new L.LatLng(y, x > 0 ? x - 30 : 330 + x) );
	  point.x = point.x + map.project(new L.LatLng(0, 30)).subtract(map.project(new L.LatLng(0, 0))).x;
		this.stream.point(point.x, point.y);
	}
	var transform180 = d3.geo.transform({point: projectPoint180}),
		path180 = d3.geo.path().projection(transform180);
	
	
	
	
	
	
	function loadBentities() {

		d3.json("../data/bentities_lores2.topojson", function(error, data){
	
			external.bentities = topojson.feature(data,data.objects.bentities_Jan2015_highres); 
		
		
			var feature = external.getBentities()
				.data(external.bentities.features)
				.enter().append("path")
				.attr("class","bentities");
				//.on("click", mapUtilities.infoPanelBentity); // maybe add code to disable click on pan?
		
			bindBentityListners();
		
			resetView();
		});
	}
	loadBentities();  
	




	// Reposition the SVG to cover the features on zoom/redraw
	function resetView() {
		if (external.bentities) {
		 	var bounds = path.bounds(external.bentities),
				topLeft = bounds[0],
		 		bottomRight = bounds[1];
		 	//path.bounds computes the projected bounding box in pixels for the specified feature
		 	//This is handy for ie zooming in to a particular feature. 
		 	//This method observes any clipping and resampling performed by the projection stream.

			svg.attr("width", bottomRight[0] - topLeft[0] + 1000)
					.attr("height", bottomRight[1] - topLeft[1])
					.style("left", topLeft[0] + "px")
					.style("top", topLeft[1] + "px");

			g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

			g.selectAll('path.bentities').attr("d", function(d) {
				if (d.properties.BENTITY == "Russia East" || d.properties.BENTITY == "Fiji") {
					return path180(d)
				}
				else {
					return path(d);
				}
			});
		}
	}
		
	map.on("viewreset", resetView);

	
	
	
	
	
	// hilight map bentities on mouseover
	(function() {
		var hilightColor;

		// called in bentity-mode for select-a-bentity view
		external.setHilightColor = function(color) {
			hilightColor = color;
		}
		
		// called by resetchoropleth
		external.resetHilightColor = function() {
			external.setHilightColor('black');
		}
		external.resetHilightColor();
		
		
		// hilight bentity on mouseover
		external.addBentityEventListner('mouseover.hilight', function() {
			d3.select(this).style('fill', hilightColor);
		});
		
		// de-hilight bentity on mouseout (set fill to 'choropleth-color' attribute)
		external.addBentityEventListner('mouseout.dehilight', function() {
			d3.select(this).style('fill', d3.select(this).attr('choropleth-color'));
		});
		
	})();
	
	
	
	
	
	// return the projection used in the leaflet map for plotting points
	external.getProjection = function() {
		return function(xy){ return map.latLngToLayerPoint(new L.LatLng(xy[1], xy[0])) };
	}
	
	
	
	// return G element to plot points into
	external.getOverlayG = function() {
		return g;
	}
		
	

	// update the map when the view is reset
	map.on('viewreset', function() {
		controls.getCurrentModeObject().resetView();
	});
	
	
	external.addBentityEventListner("nondragclick", function(d, i) {
		if (controls.getCurrentModeObject()['bentityClickHandle']) {
			controls.getCurrentModeObject().bentityClickHandle(d, i);
		}
	});
	
	
	// resets zoom level and centering to the original values as when map was first loaded
	external.resetZoom = function(){
		map.setView(new L.LatLng(37.8, 0), 2);
	};
	
	
	
	
	
	// Color the bentities on the map, using the given bentityColor function.
	// bentityColor should be a function that takes the D3-bound data for a 
	// bentity as an argument, and returns the HTML color for the bentity.
	external.choropleth = function(bentityColor) {
		baseMap.resetHilightColor();
		
		baseMap.getBentities()
		.each( function(d) {
			var color = bentityColor(d);
			
			d3.select(this)
			.style('fill', color)
			.attr('choropleth-color', color);
		});
		
	}
	

	
	// reset map colors and legend
	external.resetChoropleth = function() {
		baseMap.getBentities().style('fill', null).attr('choropleth-color', null);
		d3.selectAll('div.legendRow').remove();
		baseMap.resetHilightColor();
	};
	
	
	
	return external;
	
})();







//////////////////////////////////////////////////////////////////////////
// MAP UTILITIES
//
// Included functions: 
//////////////////////////////////////////////////////////////////////////

var mapUtilities = (function() {
	var external = {};
		
	
	// what is this for?
	external.datatest= function(data){
			if (data.properties){ //if json data
				return data.properties;
			} else { 
				return data; //else...what if it is null?
			}
	};

	
	
	// Renders an info label for a bentity or point.
	// D is the D3-bound data, i is a unique ID for the bentity or point, j is given by D3 but not used.
	// labelHTMLoption is an optional argument containing the HTML to show in the label.
	// If labelHTMLoption is not supplied, call the current mode's bentityInfoLabelHTML function.
	external.infoLabel = function(d, i, j, labelHTMLoption){
		
		var labelHTML = labelHTMLoption;
		
		if (labelHTMLoption === undefined) {
			labelHTML = controls.getCurrentModeObject().bentityInfoLabelHTML(d, i);
		} // there is a bentityInfoLabelHTML function in each mode
		
		mapUtilities.removeInfoLabel(); // clear already-existing label
		
		var infolabel = d3.select("body").append("div")
			.attr("class", "infolabel") //for styling
			.attr("id", "infolabel-" + i) // to remove label
			.html(labelHTML); //add text

	};
	baseMap.addBentityEventListner('mouseenter.infolabel', external.infoLabel);
	
	
	
	
	external.removeInfoLabel = function(d, i) {
		if (i === undefined) {  
			// if removeInfoLabel was not called as an event handler, i will not be present, so remove all info lables
			d3.select(".infolabel").remove();
		}
		else {
			// if removeInfoLabel is called as an event handler, i will be present, so remove only the div with i in the ID to prevent glitches with mouseover/mouseout timing
			d3.select("#infolabel-" + i).remove();
		}
	};
	baseMap.addBentityEventListner('mouseleave.infolabel', external.removeInfoLabel);


	
	

	// Open info panel for point data when clicked
	external.infoPanelPoints= function(data){

		var props = external.datatest(data);
	
		// label content for info panel when point is clicked
		var labelAttribute = "<h3 class='text-center'>"+props.gabi_acc_number+"</h3>"+
		"<br> Geographic Coordinates<b>:  ( "+props.lat+" , "+props.lon+" )</b>";
				
		var finalId = props.lat+props.lon;
				
				//create info label div
		var infolabel = d3.select("body").append("div")
			.attr("class", "infopanel") //for styling label
			.attr("id", finalId+"label") //for future access to label div
			.html(labelAttribute)
			.append("div")
			.attr("class","close-info")
			.attr("id","close-info")
			.html("x");
			
			d3.selectAll(".close-info")
			.on("click",function(){
				//console.log("clicked");
				d3.selectAll(".infopanel").style("display","none");
			});
	};
	
	
	



	
	
	// Open an overlay on top of the map
	// Return a D3 selection of a div that you can use to append content to the
	// info panel.
	external.openInfoPanel = function() {
		var panelOverlay = d3.select("body").append("div")
		.attr("class", "infopanel-overlay") //set z-index higher than title
		.on("click", closeInfoPanel);
	
		var infoPanel = panelOverlay.append("div")
			.attr("class", "infopanel") //for styling label
			.on("click", function(){ d3.event.stopPropagation(); }); // keep click event from bubbling up
		
		
		function closeInfoPanel() { panelOverlay.remove(); }
		
		// close-info-panel button
		infoPanel.append("div")
		.attr("class","close-info")
		.attr("id","close-info")
		.text("x")
		.on("click", closeInfoPanel);
			
		var infoPanelContent = infoPanel.append("div").attr("class", "infopanel-content")
		.html('Loading...');
		
		return infoPanelContent;
	}



	
	
	// sets the title for the current mode and displays the current selection
	external.setTitle = function(currentMode, currentSelection){
			
			var currentTitleText = "Current "+ currentMode+ " :";
			var currentSelectionText =currentSelection;
			
			$('#current-selection-title').html(currentTitleText);
			$('#current-selection').html(currentSelectionText);
	};
	
	
	
	
	// color scale generator for choropleth
	external.logBinColorScale = function(maxSpecies, zeroColor, colorArray) {

		// maxSpecies+0.0001 so the output is never colorArray.length, so we don't overstep the color array
		// domain of log scale can never be 0
		var logscale = d3.scale.log().domain([1, maxSpecies+0.0001]).range([0, colorArray.length]);

		// convert log value to color
		var colorscale = function(x) {
			if (x==0) {
				return zeroColor;
			}
			else {
				// round log value down to nearest integer to get colors
				return colorArray[Math.floor(logscale(x))];
			}
		}
		
		
		// return an array of labels for the legend  (call like logBinColorScale().binLabels)
		colorscale.binLabels = function() {
		
			// get the boundries of the different color categories
			var boundries = [0];
			for (var y = 1; y < colorArray.length && y < maxSpecies; y++) {
				boundries.push(Math.floor(logscale.invert(y)));
			}
			boundries.push(maxSpecies);
			
			// make string labels for each color category
			var binLabels = ['0'];
			for (var b = 0; b < boundries.length - 1; b++) {
				if (boundries[b] == boundries[b+1] || (boundries[b] + 1) == boundries[b+1]) {
					binLabels.push(boundries[b+1]);
				}
				else {
					binLabels.push((boundries[b] + 1) + ' ~ ' + boundries[b+1]);
				}
			}
			
			return binLabels;
		}
		
		return colorscale;
	};
	
	
	
	
	
	// Renders the legend -- "legendContainer" is the D3 selection in which to 
	// put the legend, "legendLabels" is an array with the legend labels, 
	// and "legendColors" is an array with HTML color codes.
	// The legend will have as many rows as legendLabels.length
	external.drawLegend = function (legendContainer, legendLabels, legendColors) {
						
		// remove previously-existing legend
		legendContainer.selectAll('div.legendRow').remove();
						
		// create a div for each legend item (color + label)
		legendContainer.selectAll('div.legendRow')
			.data(legendLabels)
			.enter()
			.append('div')
			.attr('class', 'legendRow')
			.each(function(d, i) {
				// add color box and label to each row
				d3.select(this).append('div')
					.attr("class","colorbox")
						.style("background-color", legendColors[i])
						.style("opacity",0.7);
				d3.select(this).append('span').text(d);
			});
	}

	
	

	
	
	return external;
})();	




///////////////////////////////////////////////////////////////////////////////
// MAP MODES

/*
* Each mode needs to have the following external methods:
* activateMode() -- called when the user switches to this mode
* deactivateMode() -- called to clean up, when the user switches to a different mode
* updateData() -- called when the "map" button is pressed
* resetData() -- clear the currently-saved data for this mode
* resetView() -- called when the map has to be re-drawn, like on zoom
* bentityInfoLabelHTML(d, i) -- returns the info-label text for a bentity, given D3-bound data d and index i
*/





//////////////////////////////////////////////////////////////////////////
//  SPECIES MODE
//
//  Functionalities for species mode: gets data, gets current species, draws points,
//                                    recolors map, draws legend, resets mode 
//  Included functions: resetView, activateMode, deactivateMode, updateData,
//                      drawLegend, updateMapColor,choropleth
//////////////////////////////////////////////////////////////////////////


var speciesMode = (function() {
	var external = {};


	categoryArray=["native","internal introduced","invasive","dubious","unverified"];
	categoryColor = ["#0571b0","#92c5de","#ca0020","#f4a582","#f7f7f7"];



	// the current data selected and mapped by the user
	var currentData = null;
	external.resetData = function() {
		currentData = {
		'speciesName': null, // current species name
		'pointRecords': null // current points to show, with {gabi_acc_number:xxx, lat:xxx, lon:xxx} for each
		}
	};
	external.resetData();
	
	
	
	// taxon_code is the key to send the server,
	// speciesName is what to display to the user
	function getSelectedSpecies() {
		return { taxon_code:  $('#sppView-species-select').val(),
				 speciesName: $('#sppView-species-select option:selected').text() };
	}
	
	
	// Re-draws all the points on the map
	// Called when the user updates the data, and when the map needs to be re-drawn 
	// (eg every time the user zooms)
	external.resetView = function() {
	
		//console.log("reset view");
		
	
		if (currentData.pointRecords) {
		
			var g = baseMap.getOverlayG();
	
			g.selectAll('.dot').remove(); // clear all dots
	
			  
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
				.attr("fill","black")
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
						'stroke':'black'
					});
				});
		
		}
	}
	


	
	// called when this mode is selected
	external.activateMode = function() {
		renderMap();
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
	

		
		if (!selectedSpp.taxon_code) {
			alert('Please select a species to map.');
			return;
		}
		
		// TODO show loading graphic?
		$("#loading-message").show();
		
		$.getJSON('/dataserver/species-points', {taxon_code: selectedSpp.taxon_code})
		.done(function(data) {
			if (data.records) {
				currentData.pointRecords = data.records;
				currentData.speciesName = selectedSpp.speciesName;
				
				renderMap();
			}
		})
		.always( function() {
			$("#loading-message").hide();
		})
		.fail(whoopsNetworkError);
	}
	
	
	
	// plot points and render choropleth
	function renderMap() {
	
		var speciesName = currentData.speciesName;
		var currentModeTitle = "Species";
		mapUtilities.setTitle(currentModeTitle,speciesName);
	
		external.resetView();
		//external.choropleth();
	}
	
	
	
	external.bentityInfoLabelHTML = function(d, i) {
		return "<h3 class='text-center'>"+d.properties.BENTITY+"</h3><br><b>Native</b>";
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
	

	
	external.choropleth = function(d, recolorMap){
	//Get data value
			
			var value = d.properties.category; 
			if (value) {
				return recolorMap(value);
			} else {
				return "black"; 
			};
			
			
	};
	
	return external;
	
})();







//////////////////////////////////////////////////////////////////////////
// DIVERSITY SUBFAMILY MODE


var diversitySubfamilyMode = (function() {

	var zeroColor = "#ffffff";
	var colorArray = ["#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"];
	var legendColors = ["#ffffff","#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"];
	
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
		.fail(whoopsNetworkError);
		
	};
	
	
	
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
			.error(whoopsNetworkError)
			.done(function(data) {
				var ul = infoPanel.append('ul');
			
				ul.selectAll('li')
				.data(data.species)
				.enter().append('li').text(function(d) {return d.display});
				//can add class or use .infopanel li
			});
		
		}
	}

	
	return external;
})();






//////////////////////////////////////////////////////////////////////////
//  DIVERSITY GENUS MODE


var diversityGenusMode = (function() {

	var zeroColor = "#ffffff";
	var colorArray = ["#bfd3e6","#8c96c6","#8c6bb1","#88419d","#6e016b"];
	var legendColors = ["#ffffff","#bfd3e6","#8c96c6","#8c6bb1","#88419d","#6e016b"];
	
	var external = {};
	

	
	// key is the key to send to the web server,
	// name is what to show the user
	function getSelectedGenus() {
		return { key:  $('#genusView-genus-select').val(),
			     name: $('#genusView-genus-select option:selected').text() };
	}

	
	
	
	
	// keep track of the data we're looking at right now
	var currentData = null;
	external.resetData = function() {
		currentData = {
			genusName: null,      // name of the current genus
			sppPerBentity: {},    // keys are bentity ID, values are species count
			maxSpeciesCount: 0    // maximum number of species for a bentity (for scale)
		}
	}
	external.resetData();


	external.updateData = function() {
		var selected = getSelectedGenus();
		
		external.resetData();
		var genusName = selected.name;
	
	
		if (!selected.key) {
			alert('Please select a genus to map.');
			return;
		}
		
		
		$("#loading-message").show();
		
		$.getJSON('/dataserver/species-per-bentity', {genus_name: selected.key})
		.done(function(data) {	
			external.resetData();
			currentData.genusName = genusName;
			
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
			
			choropleth();
		})
		.always( function() {
			$("#loading-message").hide();
		})
		.fail(whoopsNetworkError);
	};
	
	
	
	external.activateMode = function(){ choropleth(); };
	external.deactivateMode = function(){ baseMap.resetChoropleth(); };
	
	
	external.resetView = function(){};  // doesn't need to do anything for this mode



	// draw diversity-mode choropleth
	function choropleth(){
		var genusName = currentData.genusName;
		
		//NEW
		var currentModeTitle = "Genus";
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
		+ d.properties.BENTITY + "</h4><br><b>" 
		+ (currentData.genusName || "") + "</b><br><b>" 
		+ (currentData.sppPerBentity[d.properties.gid] || "0") + " species</b/>";
	}
	


	// Open an info panel with a list of species for this bentity+genus
	external.bentityClickHandle = function(d, i) {
		if (!$.isEmptyObject(currentData.sppPerBentity)) { // is there some data mapped?
			var infoPanel = mapUtilities.openInfoPanel();
			
			infoPanel.html("<h4>" + (currentData.sppPerBentity[d.properties.gid] || "0") + " species for " + currentData.genusName + " in " + d.properties.BENTITY + "</h4>");
			
			// look up species list
			$.getJSON('/dataserver/species-list', {bentity: d.properties.gid, genus: currentData.genusName})
			.error(whoopsNetworkError)
			.done(function(data) {
				var ul = infoPanel.append('ul');
						ul.selectAll('li')
				.data(data.species)
				.enter().append('li').text(function(d) {return d.display});
			});
		}
	}


	return external;
})();






//////////////////////////////////////////////////////////////////////////
// DIVERSITY BENTITY MODE
//////////////////////////////////////////////////////////////////////////

var diversityBentityMode = (function() {
	var external = {};
	
	var selectedBentityFill = 'darkorange';
	
	var zeroColor = "#ffffff";
	var colorArray = ["#d4b9da","#c994c7","#df65b0","#dd1c77","#980043"];
	var legendColors = ["#ffffff","#d4b9da","#c994c7","#df65b0","#dd1c77","#980043"];
	
	
	
	
	// unlike other modes, selected bentity is in currentData because you can set it
	// in more ways than just the select box
	var currentData = null;
	external.resetData = function(){
		currentData = {
			selectBentityView: true, // true if we're in the "select a bentity" mode, false for regular choropleth
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
		.fail(whoopsNetworkError)
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
	
	
	
	
	
	// either draw choropleth or "select a bentity" mode, and show appropriate controls
	function renderMap() {
		if (currentData.selectBentityView) {
			$("#select-bentity-instruction").show();
			$("#select-bentity-button").hide();
			baseMap.resetChoropleth();
			baseMap.setHilightColor(selectedBentityFill);
		}
		else {
			$("#select-bentity-instruction").hide();
			$("#select-bentity-button").show();
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
		+ d.properties.BENTITY + "</h4>";
		
		if (!currentData.selectBentityView) {
			labelHTML += "<br><b>" + (currentData.sppPerBentity[d.properties.gid] || "0")
		
			if (d.properties.gid == currentData.mappedBentity.key) {
				labelHTML += " species in total</b>";
			}
			else {
				labelHTML += " species in common with<br />" + currentData.mappedBentity.name + "</b/>";
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
			currentData.selectedBentity.name = d.properties.BENTITY;
			external.updateData();
		}
		
		// if we're in regular choropleth mode, open popup panel
		else {
			if (!$.isEmptyObject(currentData.sppPerBentity)) { // is there some data mapped?
				var infoPanel = mapUtilities.openInfoPanel();
			
				infoPanel.html("<h4>" + (currentData.sppPerBentity[d.properties.gid] || "0") + " species in common between " + d.properties.BENTITY + " and " + currentData.mappedBentity.name + "</h4>");
			
				// look up species list
				$.getJSON('/dataserver/species-list', {bentity: d.properties.gid, bentity2: currentData.mappedBentity.key})
				.error(whoopsNetworkError)
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
	
	
	return external;
})();





//////////////////////////////////////////////////////////////////////////
// Resets the map to its original view as when just loaded
// Resets zoom, sets toggle button to species view, clear points, 
// resets dropdown menus, closes all info panels
//////////////////////////////////////////////////////////////////////////

function resetMap(){

	speciesMode.resetData();
	diversitySubfamilyMode.resetData();
	diversityGenusMode.resetData();

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


// give the controls object a reference to each of the modes
controls.modeObjects = {
	'speciesMode': speciesMode,
	'diversitySubfamilyMode': diversitySubfamilyMode,
	'diversityGenusMode': diversityGenusMode,
	'diversityBentityMode': diversityBentityMode
}
controls.getCurrentModeObject().activateMode(); // activate the first mode



