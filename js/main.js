//////////////////////////////////////////////////////////////////////////
// Error Message
//////////////////////////////////////////////////////////////////////////

function whoopsNetworkError() {
	alert('Whoops!  Something went wrong.  Please check your internet connection and try again, or refresh the page.');
}





//////////////////////////////////////////////////////////////////////////
//  Controls: Switch modes & fill select boxes
//  Included functions: fillSelectbox,clearSelectbox,getSubfamilies
//					    getCurrentModeObject, setCurrentModeObject
//////////////////////////////////////////////////////////////////////////

var controls = (function() {

	var external = {}; // methods and variables to return and expose externally
	
	
	// keep track of which mode is currently selected
	var modes = ["speciesMode", "diversitySubfamilyMode", "diversityGenusMode", 
			"diversityBentityMode"];
	var currentMode = modes[0];// default is species mode

	// references to each of the mode objects.  This is filled in at the bottom
	// of this file, after the mode objects have been declared.  Keys are the modes in 'modes'
	external.modeObjects = {};  
	
	//////////////////////////////////////////////////////////////////////////
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
			$("#diversity_location").css("display","none");
			
			external.getCurrentModeObject().deactivateMode();
			currentMode = modes[1];		
			external.getCurrentModeObject().activateMode();
			
			$("#current-spp-title").css("display","none");
			$("#current-species").css("display","none");
			
		}else{
		
		$("#spp_view").css("display","inline");
		$("#diversity_view").css("display","none");
		
		$("#current-spp-title").css("display","inline");
		$("#current-species").css("display","inline");
		
		external.getCurrentModeObject().deactivateMode();
		currentMode = modes[0];
		external.getCurrentModeObject().activateMode();
		
	}
	
	});	

	//////////////////////////////////////////////////////////////////////////
	//diversity view 3-mode toggle		
	$(".diversity-button").on("click",function(){
	
		// toggles button display 
		$(".diversity-button").removeClass("diversity-active");
		$(this).addClass("diversity-active");
		
	
		if($("#diveristy-subfamily-button").hasClass("diversity-active")){

			// toggle mode-specific controls
			$("#diversity_subfamily").css("display","inline");
			$("#diversity_genus").css("display","none");
			$("#diversity_location").css("display","none");
	
			external.getCurrentModeObject().deactivateMode();
			currentMode = modes[1];
			external.getCurrentModeObject().activateMode();

		} 
		else if($("#diveristy-genus-button").hasClass("diversity-active")){

			$("#diversity_subfamily").css("display","none");
			$("#diversity_genus").css("display","inline");
			$("#diversity_location").css("display","none");
	
			external.getCurrentModeObject().deactivateMode();
			currentMode = modes[2];
			external.getCurrentModeObject().activateMode();

		}
		else if($("#diveristy-location-button").hasClass("diversity-active")){
	
			$("#diversity_subfamily").css("display","none");
			$("#diversity_genus").css("display","none");
			$("#diversity_location").css("display","inline");
	
			external.getCurrentModeObject().deactivateMode();
			currentMode = modes[3];
			external.getCurrentModeObject().activateMode();

		}
	}); // end diversity-button on click	

	
	//////////////////////////////////////////////////////////////////////////
	// Taxon select boxes
	// Populate a given select box (jquery object) with the given data
	function fillSelectbox(JQselectbox, data) {
		for (var i = 0; i < data.length; i++) {
			$('<option/>', {text:data[i].display, value:data[i].key}).appendTo(JQselectbox);
		}
	}
	
	//////////////////////////////////////////////////////////////////////////
	// Taxon select boxes
	// Remove a given select box, called by reset all
	external.clearSelectbox = function() {
		var boxes = $('#sppView-genus-select, #sppView-species-select, #genusView-genus-select');
		boxes.prop('disabled', true);
	};
	
	//////////////////////////////////////////////////////////////////////////
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
	

	
	//////////////////////////////////////////////////////////////////////////
	// Same as above function but called by resetMap
	external.getSubfamilies = function(){
		$.getJSON('/dataserver/subfamily-list')
		.done(function(data) {
			var boxes = $('#genusView-subfamily-select, #subfamilyView-subfamily-select, #sppView-subfamily-select');
			boxes.html('<option value="">Select Subfamily</option>');
			fillSelectbox(boxes, data.subfamilies);
			boxes.prop('disabled', false);
		})
		.fail(whoopsNetworkError);
	};
	
	//////////////////////////////////////////////////////////////////////////
	// When the species-view subfamily select box changes, populate genus select box
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
	
	//////////////////////////////////////////////////////////////////////////
	// When the species-view "select-genus" box changes, update the 'select-species' box
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
	
	//////////////////////////////////////////////////////////////////////////
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
	
	//////////////////////////////////////////////////////////////////////////
	// get the current mode
	external.getCurrentModeObject = function() {
		return external.modeObjects[currentMode];
	};
	
	//////////////////////////////////////////////////////////////////////////
	// set the current mode
	external.setCurrentModeObject = function(mode) {
		currentMode = mode;
	};
	
	return external;
})();






//////////////////////////////////////////////////////////////////////////
// Draw base map: set width and height, add tile with leaflet
// draw polygons with D3 after loading json file
// define projection in leaflet + D3 and function to reset zoom
// Included functions: projectPoint, projectPoint180, reset, getProjection,
//					   getOverlayG, registerResetListner
//////////////////////////////////////////////////////////////////////////

var baseMap = (function() {

	//TEMPORARY
	 categoryArray=["endemic","native","unknown","dubious","non-native","invasive"];
	 categoryColor = ["#2166ac","#67a9cf","#d1e5f0","#fddbc7","#ef8a62","#b2182b"];
	 categoryColorScale =  d3.scale.ordinal().domain(categoryArray)
												.range(categoryColor);

	
	var external = {}; // methods and variables to return and expose externally
	
	// map width and height in pixels
	var width = $("#mapContainer").parent().width();
	var height= 800;
	
	// set width and height of Leaflet map div
	$("#mapContainer").css({'height':height, 'width':width})

	var map = new L.Map("mapContainer", 
		{
			center: [37.8, 0], 
			zoom: 2,
			minZoom: 2
		});
		
	
	 L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map);
	
	// overlay pane for bentities
	// overlayPane = Pane for overlays like polylines and polygons.
	// the SVG element is initialized with no width or height; the dimensions must be set dynamically because they change on zoom
	var svg = d3.select(map.getPanes().overlayPane).append("svg"),
		g = svg.append("g").attr("class", "leaflet-zoom-hide");
	//The leaflet-zoom-hide class is needed so that the overlay is hidden during Leaflet’s zoom animation
	
	//////////////////////////////////////////////////////////////////////////
	// Leaflet projection for D3
	// latLngToLayerPoint: Returns the map layer point that corresponds to the given geographical coordinates (useful for placing overlays on the map).
	function projectPoint(x, y) {
		var point = map.latLngToLayerPoint(new L.LatLng(y, x)); //L.latLng(point1, point2): Represents a geographical point with a certain latitude and longitude
		this.stream.point(point.x, point.y); // this.stream.point is a D3 thing
		//d3.geo.transform creates a new stream transform using the specified hash of methods
		//To access the wrapped stream within a method, use this.stream
	}
	
	var transform = d3.geo.transform({point: projectPoint}), //there are no arguments passed to projectPoint(?)
		path = d3.geo.path().projection(transform);
	
	//////////////////////////////////////////////////////////////////////////
	// projection to use for Russia and Fiji, accross the 180th meridian
	// subtract 30 degrees from longitude, then project, then move back by 30 degrees projected
	function projectPoint180(x, y) {
		var point = map.latLngToLayerPoint(new L.LatLng(y, x > 0 ? x - 30 : -30 - x));
	  point.x = point.x + map.project(new L.LatLng(0, 30)).subtract(map.project(new L.LatLng(0, 0))).x;
		this.stream.point(point.x, point.y);
	}
	var transform180 = d3.geo.transform({point: projectPoint180}),
		path180 = d3.geo.path().projection(transform180);
	
	
	//////////////////////////////////////////////////////////////////////////
	//load bentities	
	d3.json("../data/bentities_lores2.topojson", function(error, data){
	
		external.bentities = topojson.feature(data,data.objects.bentities_Jan2015_highres); //.features;
		
		
		external.bentities2 = topojson.feature(data,data.objects.bentities_Jan2015_highres).features;
		
		//TEMPORARY
		 _.each(external.bentities2, function(bentity){
					//console.log(bentity.properties.BENTITY);
				 var category = categoryArray[Math.floor(Math.random()*categoryArray.length)];
					//randomly assign a category to the newly created 
					//category property for each bentity 
					_.extend(bentity.properties,{"category":category});
					});
		
		//console.log("external.bentities");
		//console.log(external.bentities);
		
		var feature = g.selectAll("path.bentities")
			.data(external.bentities.features)
			.enter().append("path")
			.attr("class","bentities")
			.style("fill", function(d) { //color enumeration units
											return speciesMode.choropleth(d, categoryColorScale); 
										})
			.on("mouseover",mapUtilities.highlight)
			.on("mouseout",mapUtilities.dehighlight)
			.on("click", mapUtilities.openPanelBentity);
		
		map.on("viewreset", reset);
		reset();

		
		//////////////////////////////////////////////////////////////////////////
		// Reposition the SVG to cover the features on zoom/pan
		function reset() {
		 	var bounds = path.bounds(external.bentities),
				topLeft = bounds[0],
		 		bottomRight = bounds[1];

			svg.attr("width", bottomRight[0] - topLeft[0] + 1000)
					.attr("height", bottomRight[1] - topLeft[1])
					.style("left", topLeft[0] + "px")
					.style("top", topLeft[1] + "px");

			g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

			feature.attr("d", function(d) {
				if (d.properties.BENTITY == "Russia East" || d.properties.BENTITY == "Fiji") {
					return path180(d)
				}
				else {
					return path(d);
				}
			});
		}
		
	});
	
	//////////////////////////////////////////////////////////////////////////
	// return the projection used in the leaflet map
	// TODO later maybe use other projection for points in bentities crossing 180th meridian
	external.getProjection = function() {
		return function(xy){ return map.latLngToLayerPoint(new L.LatLng(xy[1], xy[0])) };
	}
	
	//////////////////////////////////////////////////////////////////////////
	// return G element to plot points into
	external.getOverlayG = function() {
		return g;
	}
	
	//do we need this?
	//////////////////////////////////////////////////////////////////////////
	// bind a function to the map's viewreset event, fired when the map needs to re-draw
	external.registerResetListner = function(listner) {
		map.on("viewreset", listner);
	}
	
	
	//////////////////////////////////////////////////////////////////////////
	// update the map when the view is reset
	map.on('viewreset', function() {
		controls.getCurrentModeObject().resetView();
	});
	
	//////////////////////////////////////////////////////////////////////////
	// resets zoom level and centering to the original values as when map was first loaded
	external.resetZoom = function(){
		map.setView(new L.LatLng(37.8, 0), 2);
	};
	
	
	return external;
})();







//////////////////////////////////////////////////////////////////////////
// Map-related functions: highlight/ dehighlight polygons and points, draw info panel
// Included functions: highlight, dehighlight, datatest, openInfoPanel, 
//                     circleHighlight, circleDehighlight
//////////////////////////////////////////////////////////////////////////

var mapUtilities = (function() {
	

	var external = {};
	
	external.highlight = function(data){
			//console.log(data.properties.BENTITY);
			var props = external.datatest(data);
			
			var finalId = props.BENTITY.replace(" ","");
				finalId = finalId.replace(" ","");
				finalId = finalId.replace(".","");
				finalId = finalId.replace("(","");
				finalId = finalId.replace(")","");
				finalId = finalId.replace("_","");
				finalId = finalId.replace("&","");
				finalId = finalId.replace(",","");
				
				//console.log(finalId);
				
				
			d3.select(this) //select the current bentity in the DOM
			    .attr("originalcolor", d3.select(this).style('fill'))
				.style("fill", "black")
			// 	.style("opacity",0.2)
				.style("stroke","#fff");
			//the above code is not working, Uncaught TypeError: Cannot read property 'getComputedStyle' of null
			//the style part is not working
			
				
				var labelAttribute = "<h3 class='text-center'>"+props.BENTITY+"</h3><br><b>"+props.category+"</b>";
				
				
				//create info label div
				var infolabel = d3.select("body").append("div")
					.attr("class", "infolabel") //for styling label
					.attr("id", finalId+"label") //for future access to label div
					.html(labelAttribute) //add text
					.append("div") //add child div for feature name
					.attr("class", "labelname"); //for styling name
			
			
				
				
	};
	
	external.dehighlight = function(data){
		
			
			var props = external.datatest(data);
			
			var finalId = props.BENTITY.replace(" ","");
				finalId = finalId.replace(" ","");
				finalId = finalId.replace(".","");
				finalId = finalId.replace("(","");
				finalId = finalId.replace(")","");
				finalId = finalId.replace("_","");
				finalId = finalId.replace("&","");
				finalId = finalId.replace(",","");
	
			var bents = d3.select(this); //designate selector variable for brevity
			var fillcolor = bents.attr("originalcolor"); //access original color from desc
			//console.log("fillcolor");
			//console.log(fillcolor);
			bents.style("fill", fillcolor)
			// .style("opacity",0.5)
			.style("stroke","#000"); //reset enumeration unit to orginal color
	
			d3.select("#"+finalId+"label").remove(); //remove info label
	};
	
	external.datatest= function(data){
			if (data.properties){ //if json data
				return data.properties;
			} else { 
				return data; //else...what if it is null?
			};
	};
	
	external.openInfoPanel= function(data){
		//console.log(d3.select(this));
	
		var props = external.datatest(data);
	
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
	
	external.openPanelBentity = function(data){
	
		//console.log(d3.select(data));
		var props = external.datatest(data);
	
		var labelAttribute = "<h3 class='text-center'>"+props.BENTITY+"</h3>"+
		"<br> Category<b>: "+props.category+"</b>";
				
		var finalId = props.BENTITY;
				
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
	
	external.circleHighlight=function(data){
	
		var props = external.datatest(data);
				
		var labelAttribute = "<h3 class='text-center'>"+props.gabi_acc_number+"</h3>";
				
		var finalId = props.gabi_acc_number;
				
		var infolabel = d3.select("body").append("div")
					.attr("class", "infolabel") //for styling label
					.attr("id", finalId+"label") //for future access to label div
					.html(labelAttribute) //add text
					.append("div") //add child div for feature name
					.attr("class", "labelname"); //for styling name
	};
	
	external.circleDehighlight=function(data){
	
	};
	
	
	// color scale generator
	external.logBinColorScale = function(maxSpecies, zeroColor, colorArray) {

		// maxSpecies+1 so the output is never colorArray.length, so we don't overstep the color array
		// domain of log scale can never be 0
		var logscale = d3.scale.log().domain([1, maxSpecies+1]).range([0, colorArray.length]);

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
		
		// return an array of labels for the legend
		colorscale.binLabels = function() {
		
			// get the boundries of the different color categories
			var boundries = [0];
			for (var y = 1; y < colorArray.length && y < maxSpecies; y++) {
				boundries.push(Math.floor(logscale.invert(y)));
			}
			boundries.push(maxSpecies);
			
			// make string labels for each color category
			var binLabels = [];
			for (var b = 0; b < boundries.length - 1; b++) {
				binLabels.push((boundries[b] + 1) + ' ~ ' + boundries[b+1]);
			}
			
			return binLabels;
		}
		
		return colorscale;
	};
	
	
	
	
	
	return external;
})();	






//////////////////////////////////////////////////////////////////////////
//  Functionalities for species mode: gets data, gets current species, draws points,
//                                    recolors map, draws legend, resets mode 
//  Included functions: resetView, activateMode, deactivateMode, updateData,
//                      drawLegend, updateMapColor,choropleth
//////////////////////////////////////////////////////////////////////////


var speciesMode = (function() {

	var external = {};

	// the current data selected and mapped by the user
	var currentData = null;
	
	
	external.resetData = function() {
		currentData = {
		'speciesName': null,
		'pointRecords': null
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
				.on("click",mapUtilities.openInfoPanel)
				.on("mouseover",mapUtilities.circleHighlight)
				.on("mouseout",mapUtilities.circleDehighlight)
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
		external.resetView();
	}
	
	// called to reset the map back to its original state, without any data
	// for this mode, so a different map mode can render the map
	external.deactivateMode = function() {
		baseMap.getOverlayG().selectAll('.dot').remove(); // clear all dots
	}
	
	
	// called when the user presses the "map" button
	external.updateData = function() {
		var selectedSpp = getSelectedSpecies();
		
		$("#current-species").html(selectedSpp.speciesName);
		
		if (!selectedSpp.taxon_code) {
			alert('Please select a species to map.');
			return;
		}
		
		// TODO show loading graphic?
		$.getJSON('/dataserver/species-points', {taxon_code: selectedSpp.taxon_code})
		.done(function(data) {
			if (data.records) {
				currentData.pointRecords = data.records;
				currentData.speciesName = selectedSpp.speciesName;
				
				external.resetView();
			}
		})
		.fail(whoopsNetworkError);
	}
	
	external.drawLegend = function(){
	};
	
	external.updateMapColor = function(){
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
//
//////////////////////////////////////////////////////////////////////////

var diversitySubfamilyMode = (function() {

	var zeroColor = "#ffffff";
	var colorArray = ["#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"];
	var legendColor = ["#ffffff","#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"];
	
	var external = {};
	
	// subfamilyKey is the key to send to the web server,
	// subfamilyName is what to show the user
	function getSelectedSubfamily() {
		return { subfamilyKey:  $('#subfamilyView-subfamily-select').val(),
				 subfamilyName: $('#subfamilyView-subfamily-select option:selected').text() };
	}
	
	
	// keep track of the data we're looking at right now
	var currentData = null;
	external.resetData = function() {
		currentData = {
			subfamilyName: null,  // name of the current subfamily
			sppPerBentity: {},    // keys are bentity ID, values are species count
			maxSpeciesCount: 0,    // maximum number of species for a bentity (for scale)
			colorBinLabels: []
		}
	}
	external.resetData();
	
	
	external.updateData = function() {
		var selected = getSelectedSubfamily();
		
		external.resetData();
		currentData.subFamilyName = selected.subfamilyName;
		
		if (!selected.subfamilyKey) {
			alert('Please select a subfamily to map');
			return;
		}
		
		$.getJSON('/dataserver/species-per-bentity', {subfamily_name: selected.subfamilyKey})
		.done(function(data) {	
			
			external.resetData();
	
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
		.fail(whoopsNetworkError);
		
	};
	
	
	external.activateMode = function(){
		choropleth();
	};
	
	external.resetView = function(){};  // don't think this function needs to do anything
	
	external.deactivateMode = function(){
		// TODO reset bentity color
	};
	

	function choropleth(){
		if (!$.isEmptyObject(currentData.sppPerBentity)) {
			var colorScale = mapUtilities.logBinColorScale(currentData.maxSpeciesCount, zeroColor, colorArray);
			
			currentData.colorBinLabels = colorScale.binLabels().splice(0,0,0); // at a zero to the front
			
			//console.log ("currentData.colorBinLabels");
			//console.log (currentData.colorBinLabels);
			
			d3.selectAll('path.bentities')
				.style('fill', function(d) {
					if (currentData.sppPerBentity[d.properties.gid]) {
						return colorScale(currentData.sppPerBentity[d.properties.gid]);
					}
					else { return colorScale(0); // 0 species
					}
				});
				
			diversitySubfamilyMode.drawLegend();
		}
		
		
		
	};
	
	external.drawLegend = function(){
				var legend = d3.select("#diversity-subfamily-legend")
							   .attr("width",200)
							   .attr("height",250);
				
				legend.selectAll('div.legendRow').remove();
				
				legend.selectAll('div.legendRow')
					.data(currentData.colorBinLabels)
					.enter()
					.append('div')
					.attr('class', 'legendRow')
					.each(function() {
						this.append('div')
							.attr("class","colorbox")
								.style("background-color",function(d,i){
										return legendColor[i];
								 })
								 .style("opacity",0.7);
						this.append('span').text(function(d){d});
					});
					
				/*
				var legendColors = legend.append("div").attr("class","legendColorsDiv");
	    		
	    			    		
	    		legendColors.selectAll(".colorbox")
								.data(legendColor)
								.enter()
								.append("div")
								.attr("class","colorbox")
								.style("background-color",function(d){
										return d
								 })
								 .style("opacity",0.7);
								 
				 
				 legend.selectAll('div.legendNumDiv').remove();
				
				//create a separate div to hold each number in the number scale
				var legendNum = legend.append("div").attr("class","legendNumDiv");
				
				
				
				//console.log(currentData.colorBinLabels);
				
				legendNum.selectAll(".legendNum")
					.data(currentData.colorBinLabels)
					.enter()
					.append("div")
					.attr("class","legendNum")
					.html(function(d){
						return d
					});*/
		
			
	}
	
	return external;
})();





//////////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////////

var diversityGenusMode = (function() {

	var legendColor = ["#ffffff","#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"];
	var external = {};
	external.activateMode = function(){};
	external.deactivateMode = function(){};
	external.resetView = function(){};
	external.drawLegend = function(){
				var legend = d3.select("#diversity-genus-legend")
							   .attr("width",200)
							   .attr("height",250);
				
				var legendColors = legend.append("div").attr("class","legendColorsDiv");
	    		
	    		legendColors.selectAll(".colorbox").remove(); 
	    		
	    		legendColors.selectAll(".colorbox")
								.data(legendColor)
								.enter()
								.append("div")
								.attr("class","colorbox")
								.style("background-color",function(d){
										return d
								 });
	}
	return external;
})();




//////////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////////

var diversityBentityMode = (function() {
	var external = {};
	external.activateMode = function(){};
	external.deactivateMode = function(){};
	external.resetView = function(){};
	return external;
})();





//////////////////////////////////////////////////////////////////////////
// Resets the map to its original view as when just loaded
// Resets zoom, sets toggle button to species view, clear points, 
// resets dropdown menus, closes all info panels
//////////////////////////////////////////////////////////////////////////

function resetMap(){
	controls.getCurrentModeObject().deactivateMode(); //not working for some reason...because the points redraw on zoom change
	//then should set mode to species mode and activate mode
	controls.setCurrentModeObject("speciesMode");
	speciesMode.resetData();
	//controls.getCurrentModeObject().activateMode(); 
	// then should switch the toggle button back
	$(".button-wrap").removeClass("button-active");
	$("#spp_view").css("display","inline");
	$("#diversity_view").css("display","none");
	$("#view-title").html("Species View");
	$("#current-species").html("");
	$(".infopanel").css("display","none");
	//then should repopulate subfamily select boxes
	controls.clearSelectbox(); // hmmm weird
	controls.getSubfamilies();	
	baseMap.resetZoom(); 
	//the points are redrawn everytime the zoom is different, so resetZoom and deactivateMode automatically cancels each other out
	
}


// give the controls object a reference to each of the modes
controls.modeObjects = {
	'speciesMode': speciesMode,
	'diversitySubfamilyMode': diversitySubfamilyMode,
	'diversityGenusMode': diversityGenusMode,
	'diversityBentityMode': diversityBentityMode
}
controls.getCurrentModeObject().activateMode(); // activate the first mode



