var controls = (function() {

	var external = {}; // methods and variables to return and expose externally
	
	
	// keep track of which mode is currently selected
	var modes = ["speciesMode", "diversitySubfamilyMode", "diversityGenusMode", 
			"diversityBentityMode"];
	var currentMode = modes[0];// default is species mode




	// FIXME: move into mode objects
	// subfamilies to populate dropdown box (use ID's later?)
	var subfamilies= ["Agroecomyrmecinae","Amblyoponinae","Aneuretinae"];

	// TODO: populate genus/species boxes

	// TODO: species select box



	// FIXME: move into mode objects

	// return the currently-selected subfamily
	external.getSubfamily = function() {
		// TODO: use subfamily ID instead?
		return $("#sppView-subfamily-select option:selected").text();
	};
	
	
	// return the currently-selected subfamily
	external.getGenus = function() {
		// TODO: use genus ID instead?
		return $("#sppView-genus-select option:selected").text();
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
			$("#diversity_location").css("display","none");
			
			currentMode = modes[1];
			updateColorSubfamilyMap();		//FIXME			
		}else{
		
		$("#spp_view").css("display","inline");
		$("#diversity_view").css("display","none");
		
		currentMode = modes[0];
		//call function to populate dropdowns
		loadDropdownSpeciesMode(); //FIXME
		updateColorSpeciesMap(); //FIXME
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
	
			currentMode = modes[1];
	
			loadDropdownDiversitySubfamilyMode(); // FIXME
			//updateMapSubfamily(); // not working

		} 
		else if($("#diveristy-genus-button").hasClass("diversity-active")){

			$("#diversity_subfamily").css("display","none");
			$("#diversity_genus").css("display","inline");
			$("#diversity_location").css("display","none");
	
			currentMode = modes[2];
	
			loadDropdownDiversityGenusMode(); //FIXME

		}
		else if($("#diveristy-location-button").hasClass("diversity-active")){
	
			$("#diversity_subfamily").css("display","none");
			$("#diversity_genus").css("display","none");
			$("#diversity_location").css("display","inline");
	
			currentMode = modes[3];
	
			loadBentityDropdown(); //FIXME

		}
	}); // end diversity-button on click
	
	
	
	
	
	
	
	
	return external;
})();




// contains leaflet map, draws bentities
var baseMap = (function() {
	
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
	
	// overlay pane for bentities
	var svg = d3.select(map.getPanes().overlayPane).append("svg"),
		g = svg.append("g").attr("class", "leaflet-zoom-hide");
	
	// Leaflet projection for D3
	function projectPoint(x, y) {
		var point = map.latLngToLayerPoint(new L.LatLng(y, x));
		this.stream.point(point.x, point.y);
	}
	var transform = d3.geo.transform({point: projectPoint}),
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
		
		var feature = g.selectAll("path.bentities")
			.data(external.bentities.features)
			.enter().append("path")
			.attr("class","bentities")
			.style("fill", '#333');
		
		map.on("viewreset", loadBentities);
		reset(external.bentities);

		
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
		
		function loadBentities() {
			var bbox = map.getBounds().toBBoxString();
			
			$('path.bentities').remove();
			
			$.getJSON('/dataserver/bentities', {'bbox': bbox})
			.fail(function(){
				alert('Whoops!  Something went wrong.  Please check your internet connection and try again.');
			})
			.done(function(data){
				external.bentities = data;
				
				feature = g.selectAll("path.bentities")
					.data(external.bentities.features)
					.enter().append("path")
					.attr("class","bentities")
					.style("fill", '#333');
					
				reset();
			});
			
			
		}
		
	});
	
	return external;
})();


