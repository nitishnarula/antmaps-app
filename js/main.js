var controls = (function() {

	var members = {}; // methods and variables to return and expose externally
	
	
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
	members.getSubfamily = function() {
		// TODO: use subfamily ID instead?
		return $("#subfamily-select option:selected").text();
	};
	
	
	// return the currently-selected subfamily
	members.getGenus = function() {
		// TODO: use genus ID instead?
		return $("#subfamily-select option:selected").text();
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
	
	
	
	
	
	
	
	
	return members;
})();





var baseMap = (function() {
	
	var members = {}; // methods and variables to return and expose externally
	
	// map width and height in pixels
	var width = $("#mapContainer").parent().width();
	var height= 800;
	
	// set width and height of Leaflet map div
	$("#mapContainer").css({'height':height, 'width':width})

	var map = new L.Map("mapContainer", {center: [37.8, -96.9], zoom: 4});
	
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
	
	//load bentities	
	d3.json("../data/bentities_highres_new.json", function(error, data){
	
		var bentities = topojson.feature(data,data.objects.bentities_Jan2015_highres); //.features;
		
		var feature = g.selectAll("path.bentities")
			.data(bentities.features)
			.enter().append("path")
			.attr("class","bentities")
			.style("fill", '#333');
		
		map.on("viewreset", reset);
		reset();

		
		// Reposition the SVG to cover the features on zoom/pan
		function reset() {
		 	var bounds = path.bounds(bentities),
				topLeft = bounds[0],
		 		bottomRight = bounds[1];

			svg.attr("width", bottomRight[0] - topLeft[0])
					.attr("height", bottomRight[1] - topLeft[1])
					.style("left", topLeft[0] + "px")
					.style("top", topLeft[1] + "px");

			g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

			feature.attr("d", path);
		}
		
	});
	
	return members;
})();


