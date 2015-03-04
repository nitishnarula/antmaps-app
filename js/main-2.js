var controls = (function() {

	var methods = {}; // methods to return and expose externally
	
	
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
	methods.getSubfamily = function() {
		// TODO: use subfamily ID instead?
		return $("#subfamily-select option:selected").text();
	};
	
	
	// return the currently-selected subfamily
	methods.getGenus = function() {
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
	
	
	
	
	
	
	
	
	return methods;
})();







var baseMap = (function() {

	var methods = {}; // methods to return and expose externally

	// map width and height in pixels
	var width = $("#mapContainer").parent().width();
	var height= 800;

	//initial projection
	var projection = d3.geo.mercator()
		.scale(180)           // we'll scale up to match viewport shortly.
		.translate([width/2, height/2])
		.center([370, 38]);
	
	 //took out the var to make it global so recolor functions can access it
     map= d3.select("#mapContainer")
			.append("svg")
			.attr("width",width)
			.attr("height",height)
			.attr("id","map");	
		
		
	 var graticule = d3.geo.graticule()
			.step([20, 20]);
		
		 path = d3.geo.path()
						.projection(projection);
					
		 map.append("path")
				.datum(graticule)
				.attr("class", "graticule")
				.attr("d", path);
		
	  var gratBackground=map.append("path")
				.datum(graticule.outline)
				.attr("class","gratBackground")
				.attr("d",path)
			
	  var gratLines=map.selectAll(".gratLines")
				.data(graticule.lines)
				.enter()
				.append("path")
				.attr("class","gratLines")
				.attr("d",path);

		   
			
		  //load bentities	
			d3.json("../data/bentities_highres_new.json", function(error, data){
					
				//was var	
				 bentities = 
				  topojson.feature(data,data.objects.bentities_Jan2015_highres).features;
					
				console.log(bentities.length);//534 for low res, 527 for high res
				  
				 _.each(bentities, function(bentity){
					//console.log(bentity.properties.BENTITY);
				 var category = categoryArray[Math.floor(Math.random()*categoryArray.length)];
					//randomly assign a category to the newly created 
					//category property for each bentity 
					_.extend(bentity.properties,{"category":category});
				
					bentityArray.push(bentity.properties.BENTITY); 
					// push bentities into bentityArray 
				 
					bentityArray = _.sortBy(bentityArray, function(d) {
									return d;
									});//sort array alphabetically	
								
					// var number = arr[Math.floor(Math.random()*arr.length)];
					//_.extend(bentity.properties,{"subfamily":number});		 
			 
					});

			  var bentitiesMapped = map.selectAll(".bentities")
										.data(topojson.feature(data,
										 data.objects.bentities_Jan2015_highres).features)
										.enter()
										.append("path")
										.attr("class","bentities")
										.attr("d",path);
										//.style("fill", function(d) { //color enumeration units
										//	return choropleth(d, categoryColorScale); 
										//})
										//.on("mouseover",highlight);
												
					   
			   
	});//end d3.json




	// get the projection 
	methods.getProjection = function() {
		return projection;
	}


	return methods;
})();
