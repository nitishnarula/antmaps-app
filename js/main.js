//GLOBAL VARIABLES
	
	//to populate dropdown / autocomplete
//	var subfamilyArray= ["Agroecomyrmecinae","Amblyoponinae","Aneuretinae"];
	 //should be around 19 subfamilies
//	var genusArray=[];
//	var speciesArray=[];
//	var bentityArray= [];
	
//	var sppBrowseArray = []; // All species, to populate species browse panel on species view
	
	//to detect current mode: speciesMode, diversitySubfamilyMode, 
	// diversityGenusMode, diversityLocationMode
	var modes = ["speciesMode", "diversitySubfamilyMode", "diversityGenusMode", 
				"diversityLocationMode"];
	var currentMode = modes[0];// default is species mode
	
//	var subfamilySelected;
	var genusSelected;
	var speciesSelected;
	var locationSelected; // or bentity selected
	
	//D3 color scale for species view
	var categoryArray=["endemic","native","unknown","dubious","non-native","invasive"];
	var categoryColor = ["#2166ac","#67a9cf","#d1e5f0","#fddbc7","#ef8a62","#b2182b"];
	var categoryColorScale =  d3.scale.ordinal().domain(categoryArray)
												.range(categoryColor);
	//D3 color scale for diversity view											
	var diversityColorArray = ["#fef0d9","#fdd49e","#fdbb84","#fc8d59","#e34a33","#b30000"];
	var diversityColorScale;
	
			
	//sample data I inserted as properties of each bentity later on to test the diversity view	
	var arr = [];
	for (var i = 0, l = 40; i < l; i++) {
		arr.push(Math.round(Math.random() * l))
	}
	
	
	 //the below should all be called on load
	
	 loadDropdownSpeciesMode();
	 // since this is the default mode it should be populated on load
	 
	 loadDropdownDiversitySubfamilyMode(); //populate on load
	 
	 drawLegend();
	 drawLegendDiversityView();
	 
	 var bentities; //new
	 var map; //new
	 
	 var myMap = setMap();
	

				
	

		
		
		
		
		//species browse button, on click then opens the panel
		$("#browse").on("click",function(){
					$("#spp-browse-panel").css("display","inline");
		});
		
		//if click on "X" button then closes the panel
		$("#close").on("click",function(){
					$("#spp-browse-panel").css("display","none");
		});
	



			
		/*  Scripts to load dropdown */
		
		// 1 of 4 modes
		// <-- fired on load
		//populate the dropdown menus of the species view, the genus and species dropdowns
	    // are filtered depending on the selected subfamily and genus
		function loadDropdownSpeciesMode(){
		
			$('#subfamily-select').empty();
		
			for(var field=0; field<subfamilyArray.length;field++){
				  
				$('#subfamily-select').append(
			        $('<option></option>')
			        .val(subfamilyArray[field]).html(subfamilyArray[field])
			      );	     
			   
			}
			
			
			 /*$("#subfamily-select").change(function () {
			 	
			 
			 	subfamilySelected = $("#subfamily-select option:selected").text();
			 	
			 	
			 	//filter all records to find the ones where subfamily = selected _.filter	
			 	
			 	//store all genus in one array	_.pluck or _.pick the genus property	 	
			 	
			 	//go over this list to find unique genera in the chosen subfamily  _.uniq
			 	
			 	//do the same for species
		
			 });*/
		
		}
		
		
		// 2 of 4 modes
		// <-- fired on load
		//populate subfamily dropdown menu for diversity-subfamily mode
		function loadDropdownDiversitySubfamilyMode(){
		
			$('#subfamily-select2').empty();
		
			for(var field=0; field<subfamilyArray.length;field++){
				  
				$('#subfamily-select2').append(
			        $('<option></option>').val(subfamilyArray[field]).html(subfamilyArray[field])
			      );	     
			   
			}			
		}
		
		
		// 3 of 4 
		//populate subfamily and genus dropdown menus for diversity-genus mode
		function loadDropdownDiversityGenusMode(){
			
		}
		
		// 4 of 4
		//populate bentity dropdown menu for diversity-location mode
		// called after the bentity topojson file is loaded
		function loadBentityDropdown(){
			$('#bentity-select').empty();
		
			for(var field=0; field<bentityArray.length;field++){

				$('#bentity-select').append(
			        $('<option></option>').val(bentityArray[field]).html(bentityArray[field])
			    );	
			      
		    }//end for     			
		}
		
		
		// fired whenever the user hits the "map" button
		// checks the current mode, then checks if the user selected all that is required, 
		// then updates the selected items, then call the respecting functions to update map depending on the mode
		function updateResults(){
		
			if(currentMode == "speciesMode"){
			
				if(subfamilySelected == "Select Subfamily"){
					alert("Pick a Subfamily");
				}else if(genusSelected == "Select Genus"){
					alert("Pick a Genus");
				}else if(speciesSelected == "Select Species"){
					alert("Pick a Species");
				}else{
		
					subfamilySelected = $('#subfamily-select').val();
					genusSelected = $('#genus-select').val();
					speceisSelected = $('#species-select').val();
					//SUCCESS, so update map
					drawPointsSpeciesMap();
					updateColorSpeciesMap();
				}
				
				
			}else if(currentMode == "diversitySubfamilyMode"){
			
			
				if(subfamilySelected == "Select Subfamily"){
					alert("Pick a Subfamily");
				}else{
					subfamilySelected = $('#subfamily-select2').val();
					//SUCCESS, so update map
					updateColorSubfamilyMap();
				}
				
			}else if(currentMode == "diversityGenusMode"){
				
				if(subfamilySelected == "Select Subfamily"){
					alert("Pick a Subfamily");
				}else if(genusSelected == "Select Genus"){
					alert("Pick a Genus");
				}else{
				
					subfamilySelected = $('#subfamily-select3').val();
					genusSelected = $('#genus-select2').val();
					updateColorGenusMap();
				}
			
			}else{
				if(bentitySelected == "Select Location"){
					alert("Pick a Location");
				}else{
					updateColorLocationMap();
				}
			}
	
		} // end updateResults
		

		
		// called on page load
		
		//sets the base map, projection, zoom behavior
		//loads in bentities and colors them according to category
		//includes functions that are required to implement rolling pan/zoom map: 
		//redraw(),mercatorBounds()
		//resetZoom()
		function setMap(){
		


			
			

			

	
		
		    // find the top left and bottom right of current projection
			mapFunctions.mercatorBounds = function(projection, maxlat) {
				var yaw = projection.rotate()[0],
				xymax = projection([-yaw+180-1e-6,-maxlat]),
				xymin = projection([-yaw-180+1e-6, maxlat]);
				return [xymin,xymax];
			 }	
			
			
			// set up the scale extent and initial scale for the projection
			var b = mapFunctions.mercatorBounds(projection, maxlat),
				 s = width/(b[1][0]-b[0][0]),
				 scaleExtent = [s, 10*s];
				
			 projection
				 .scale(scaleExtent[0]);	
			 
			 
			 var reDrawHack = function() { 
			 	mapFunctions.redraw()
			 };
			 
			 
			 var zoom = d3.behavior.zoom()
				.scaleExtent(scaleExtent)
				.scale(projection.scale())
				.translate([0,0])               
				.on("zoom", reDrawHack);	 
			
			 var center = projection([370, 38]);
			
			 //took out the var to make it global so recolor functions can access it
		     map= d3.select("#mapContainer")
					.append("svg")
					.attr("width",width)
					.attr("height",height)
					.attr("id","map")
					.call(zoom);	
				
				
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
								
					 var number = arr[Math.floor(Math.random()*arr.length)];
					_.extend(bentity.properties,{"subfamily":number});		 
			 
					});
					
					console.log(bentities);
						
			 //load location dropdown after bentityArray is populated
			  loadBentityDropdown();
		  
		 
			  var bentitiesMapped = map.selectAll(".bentities")
										.data(topojson.feature(data,
										 data.objects.bentities_Jan2015_highres).features)
										.enter()
										.append("path")
										.attr("class","bentities")
										.attr("d",path)
										.style("fill", function(d) { //color enumeration units
											return choropleth(d, categoryColorScale); 
										})
										.on("mouseover",highlight);
												
					 
			   mapFunctions.redraw();  
			   

		   });//end d3.json



			//redraw map based on new projection on pan or zoom
			mapFunctions.redraw = function() {
				if (d3.event) { 
					var scale = d3.event.scale,
						t = d3.event.translate;                
		
				   // if scaling changes, ignore translation (otherwise touch zooms are weird)
					if (scale != slast) {
						projection.scale(scale);
					} else {
						var dx = t[0]-tlast[0],
							dy = t[1]-tlast[1],
							yaw = projection.rotate()[0],
							tp = projection.translate();
		
						// use x translation to rotate based on current scale
						projection.rotate([yaw+360.*dx/width*scaleExtent[0]/scale, 0, 0]);
						// use y translation to translate projection, clamped by min/max
						var b = mapFunctions.mercatorBounds(projection, maxlat);
						if (b[0][1] + dy > 0) dy = -b[0][1];
						else if (b[1][1] + dy < height) dy = height-b[1][1];
						projection.translate([tp[0],tp[1]+dy]);
					}
					// save last values.  resetting zoom.translate() and scale() would
					// seem equivalent but doesn't seem to work reliably?
					slast = scale;
					tlast = t;
		
				}// end if
	
				map.selectAll('path')       // re-project path data
					.attr('d', path);
						
				console.log(zoom.scale()); // why does it keep adding?
			}//end redraw
		
		
		//resets map to initial zoom/pan.  fired when user clicks on reset map widget
		mapFunctions.resetZoom = function(){


			projection.rotate([rotate,0])
					.scale(1)           // we'll scale up to match viewport shortly.
					.translate([width/2, height/2])
					.center([0,30]);	
			
			var b = mapFunctions.mercatorBounds(projection, maxlat),
					 s = width/(b[1][0]-b[0][0]),
					 scaleExtent = [s, 10*s];

				 projection
					 .scale(scaleExtent[0]);
	
			map.selectAll('path') // re-project path data
				.transition()
				.duration(2000) //transition not working      
				.attr('d', path);

			mapFunctions.redraw();
		}// end resetZoom
		
		return mapFunctions;
		

	}//end setMap


		
		
		// choropleth for species view
		// the color scheme we use for the species view
		// can set the value we want to be displayed, in this case: category
		function choropleth(d, recolorMap){
			//Get data value
			var value = d.properties.category; 
			if (value) {
				return recolorMap(value);
			} else {
				return "black"; 
			};
		};
		
		
		// choropleth for diversity view
		// the color scheme we use for the diversity modes (all 3 modes use the same color scheme,
		// will just need to update the text of the legend)
		// can set the value we want to be displayed, in this case: subfamily (temporary test case, but not working)
		function choroplethDiversity(d, recolorMap){
			//Get data value
			var value = d.properties.subfamily; 
			if (value) {
				return recolorMap(value);
			} else {
				return "black"; 
			};
		};
		
		
		//sets the domain and range and type of color scale for the diversity view 
		
		function colorScaleDiversityView(){		
			
				var color = d3.scale.quantile() //designate quantile scale generator
				.range(diversityColorArray);
				
				var max = d3.max(arr, function(d) { return +d;} );
		
				//set min and max data values as domain
				color.domain([0,max]);

				//return the color scale generator
				return color;	
		}
		
		
		//colorScaleSpeciesView is not a function, instead categoryColorScale
		// is a global variable that is already set
		

		// <-- fired on load
		// draws the species view legend
		function drawLegend(){			
				var legend = d3.select("#species-legend")
								.attr("width",200)
								.attr("height",250);
				
				var legendColors = legend.append("div").attr("id","legendColors");
				
				var colorBox = legendColors.selectAll(".colorbox")
								.data(categoryColor)
								.enter()
								.append("div")
								.attr("class","colorbox")
								.style("background-color",function(d){
										return d
									});
									
				var legendScale = legend.append("div").attr("id","legendScale");					
									
				var legendCategory = legendScale
											.selectAll(".legendNum")
											.data(categoryArray)
											.enter()
											.append("div")
											.attr("class","categoryName")
											.text(function(d){
												return d;
												});

		}
		
		//spp view legend don't need to be updated since it is set categories
		// <-- fired on load
		//draws the diversity view legend
		function drawLegendDiversityView(){
	   		 var legend = d3.select("#diversity-legend")
								.attr("width",200)
								.attr("height",250);
				
				var legendColors = legend.append("div").attr("id","legendColorsDiv");
	    		
	    		legendColors.selectAll(".colorbox")
								.data(diversityColorArray)
								.enter()
								.append("div")
								.attr("class","colorbox")
								.style("background-color",function(d){
										return d
									});
	    
	    }
	    
	    function updateLegendDiversityView(){			 
	    }

		
		//if currentMode is "diversityLocationMode"
		function centerOnBentity(bentity){
			//get the centroid of the bentity
			//set projection center to that, and set the scale and translation accordingly
			
		}

	    //<--updateMapSpecies()
	    function drawPointsSpeciesMap(){	
		}
		
		//<--updateResults()
		function updateColorSpeciesMap(){
			 
	      d3.selectAll(".bentities")
					.style("fill", function(d) { //color enumeration units
											return choropleth(d, categoryColorScale); 
					});	
		}
		
		//<--updateResults()
		//NOT WORKING!!
	    function updateColorSubfamilyMap(){
	    
	    console.log("entered updateColorSubfamilyMap");
	    
	     d3.selectAll(".bentities")
					.style("fill", function(d) { //color enumeration units
						return choroplethDiversity(d, colorScaleDiversityView()); 
					});							
	
	    	
	    }
	    
		
		//<--updateResults()
		function updateColorGenusMap(){
		}
		
		//<--updateResults()
		function updateColorLocationMap(){
		}
		
		//<--updateColorSpeciesMap(),updateColorSubfamilyMap(),updateColorGenusMap(),updateColorLocationMap()
		function highlight(data){
	
			var props = datatest(data);	//standardize json or csv data
	
			d3.select(this) //select the current province in the DOM
				.style("fill", "#000")
				.style("stroke","#fff"); //set the enumeration unit fill to black
	
			
			var labelAttribute; //html string for attribute in dynamic label
			
			if(currentMode == modes[0]){
				labelAttribute = "<h3 class='text-center'>"+props.BENTITY+"</h3><br><b>"+props.category+"</b>"; 
			}else if (currentMode == modes[1]){
				labelAttribute = "<h3 class='text-center'>"+props.BENTITY+"</h3><br><b>"+props.subfamily+"</b>";
			}else if (currentMode == modes[2]){
			}else{};				
	
			//create info label div
			var infolabel = d3.select("body").append("div")
				.attr("class", "infolabel") //for styling label
				.attr("id", props.BENTITY+"label") //for future access to label div
				.html(labelAttribute) //add text
				.append("div") //add child div for feature name
				.attr("class", "labelname"); //for styling name
					
		};
		
		//<--updateColorSpeciesMap(),updateColorSubfamilyMap(),updateColorGenusMap(),updateColorLocationMap()
		function dehighlight(){
			var props = datatest(data);	//standardize json or csv data
	
	
		}
		
		function datatest(data){
			//<-highlight
			//<-dehighlight
	
			if (data.properties){ //if json data
				return data.properties;
			} else { //if csv data
				return data;
			};
		};
		
		//can be below legend or at the top right corner of map
		function drawInfoPanel(){
		}
		
		//to get the top 5-10 most diverse bentities in order to draw a bar chart
		function topBentities(){
		}
		
		function drawBar(){
		}
		
		function populateBottomPanel(){
		}
		
		
	    
