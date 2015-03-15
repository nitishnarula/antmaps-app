
function whoopsNetworkError() {
	alert('Whoops!  Something went wrong.  Please check your internet connection and try again, or refresh the page.');
}

var controls = (function() {

	var external = {}; // methods and variables to return and expose externally
	
	
	// keep track of which mode is currently selected
	var modes = ["speciesMode", "diversitySubfamilyMode", "diversityGenusMode", 
			"diversityBentityMode"];
	var currentMode = modes[0];// default is species mode

	// references to each of the mode objects.  This is filled in at the bottom
	// of this file, after the mode objects have been declared.  Keys are the modes in 'modes'
	external.modeObjects = {};  
	
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
	
	// On page load, get list of subspecies and fill subspecies select boxes
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
	
	external.getCurrentModeObject = function() {
		return external.modeObjects[currentMode];
	};
	
	return external;
})();




// contains leaflet map, draws bentities
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
	
	// projection to use for Russia and Fiji, accross the 180th meridian
	// subtract 30 degrees from longitude, then project, then move back by 30 degrees projected
	function projectPoint180(x, y) {
		var point = map.latLngToLayerPoint(new L.LatLng(y, x > 0 ? x - 30 : -30 - x));
	  point.x = point.x + map.project(new L.LatLng(0, 30)).subtract(map.project(new L.LatLng(0, 0))).x;
		this.stream.point(point.x, point.y);
	}
	var transform180 = d3.geo.transform({point: projectPoint180}),
		path180 = d3.geo.path().projection(transform180);
	
	
	
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
			.on("mouseout",mapUtilities.dehighlight);
		
		map.on("viewreset", reset);
		reset();

		
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
	
	
	// return the projection used in the leaflet map
	// TODO later maybe use other projection for points in bentities crossing 180th meridian
	external.getProjection = function() {
		return function(xy){ return map.latLngToLayerPoint(new L.LatLng(xy[1], xy[0])) };
	}
	
	// return G element to plot points into
	external.getOverlayG = function() {
		return g;
	}
	
	// bind a function to the map's viewreset event, fired when the map needs to re-draw
	external.registerResetListner = function(listner) {
		map.on("viewreset", listner);
	}
	
	
	// update the map when the view is reset
	map.on('viewreset', function() {
		controls.getCurrentModeObject().resetView();
	});
	
	
	return external;
})();




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
				.style("opacity",1)
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
			.style("opacity",0.5)
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
	
	return external;
})();	


var speciesMode = (function() {

	var external = {};

	// the current data selected and mapped by the user
	var currentData = {
		'speciesName': null,
		'pointRecords': null
	}
	
	
	function getSelectedSpecies() {
		return { taxon_code:  $('#sppView-species-select').val(),
				 speciesName: $('#sppView-species-select').text() };
	}
	
	
	// Re-draws all the points on the map
	// Called when the user updates the data, and when the map needs to be re-drawn (eg for zoom)
	external.resetView = function() {
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
				.attr('r',4);
		
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

var diversitySubfamilyMode = (function() {
	
	var external = {};
	external.activateMode = function(){};
	external.deactivateMode = function(){};
	external.resetView = function(){};
	
	external.subfamily_dropdown = function(){};
	external.choropleth = function(){};
	
	return external;
})();

var diversityGenusMode = (function() {
	var external = {};
	external.activateMode = function(){};
	external.deactivateMode = function(){};
	external.resetView = function(){};
	return external;
})();

var diversityBentityMode = (function() {
	var external = {};
	external.activateMode = function(){};
	external.deactivateMode = function(){};
	external.resetView = function(){};
	return external;
})();



// give the controls object a reference to each of the modes
controls.modeObjects = {
	'speciesMode': speciesMode,
	'diversitySubfamilyMode': diversitySubfamilyMode,
	'diversityGenusMode': diversityGenusMode,
	'diversityBentityMode': diversityBentityMode
}
controls.getCurrentModeObject().activateMode(); // activate the first mode
