		drawLegend();
		drawLegendDiversityView();
		
		var arr = [];
		
		for (var i = 0, l = 40; i < l; i++) {
			arr.push(Math.round(Math.random() * l))
			// console.log(arr[i]);
		}

		
		 var width = $("#mapContainer").parent().width();
		 var height= 800;
		 
		 var  rotate = 60;        // so that [-60, 30] becomes initial center of projection
         var  maxlat = 83;        // clip northern and southern poles (infinite in mercator)
		 

		  var projection = d3.geo.mercator()
    		.rotate([rotate,0])
    		.scale(1)           // we'll scale up to match viewport shortly.
   			.translate([width/2, height/2])
   			.center([0,30]);	    
   			
   			
   		 // find the top left and bottom right of current projection
		function mercatorBounds(projection, maxlat) {
    		var yaw = projection.rotate()[0],
      	    xymax = projection([-yaw+180-1e-6,-maxlat]),
            xymin = projection([-yaw-180+1e-6, maxlat]);
    
            return [xymin,xymax];
         }	
   			
   			
   		// set up the scale extent and initial scale for the projection
		var b = mercatorBounds(projection, maxlat),
   			 s = width/(b[1][0]-b[0][0]),
   			 scaleExtent = [s, 10*s];

		 projection
    		 .scale(scaleExtent[0]);	
    		 
    		 
    	 var zoom = d3.behavior.zoom()
    		.scaleExtent(scaleExtent)
    		.scale(projection.scale())
    		.translate([0,0])               // not linked directly to projection
    		.on("zoom", redraw);	 
   			
		 var center = projection([370, 38]);
			
		 var  map= d3.select("#mapContainer")
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
			    	
		   
			
		    	
	    d3.json("../data/bentities_highres_new.json", function(error, data){
	    			
				  	
				  	 var bentities = topojson.feature(data,data.objects.bentities_Jan2015_highres).features;
				  	

				  		  console.log(bentities.length);//534 for low res, 527 for high res
				  
				  	 _.each(bentities, function(bentity){
				  	 	//console.log(bentity.properties.BENTITY);
				  	 	var category = categoryArray[Math.floor(Math.random()*categoryArray.length)];
				  	 	//randomly assign a category to the newly created category property for each bentity 
				  	 	_.extend(bentity.properties,{"category":category});
				  	 	
				  	 	//console.log(bentity.properties.BENTITY);
				  	    bentityArray.push(bentity.properties.BENTITY); // push bentities into bentityArray 
				  	     
				  	    bentityArray = _.sortBy(bentityArray, function(d) {
				  	    				return d;
				  	    				});//sort array alphabetically	
				  	    				
				  	     var number = arr[Math.floor(Math.random()*arr.length)];
 				  	 	_.extend(bentity.properties,{"subfamilys":number});		 
				  	 
				  	 	});
				  	 	
				  	
				  	 
				  	  //console.log(bentityArray);
				  	  
				  	  //load location dropdown after bentityArray is populated
				  	  loadBentityDropdown();
				  	  
				  	 
				  	  var bentitiesMapped = map.selectAll(".bentities")
				  	 							.data(topojson.feature(data,data.objects.bentities_Jan2015_highres).features)
				  	 							.enter()
				  	 							.append("path")
				  	 							.attr("class","bentities")
				  	 							.attr("d",path)
				  	 							.style("fill", function(d) { //color enumeration units
													return choropleth(d, categoryColorScale); //colorScale()
										});
				  	 							
				  	 
				  	 redraw();  

		   });//end d3.json


		
		
// 		 d3.json("../data/water.topojson", function(error, data){
// 		 	var water = map.append("path")
// 		 				.datum(topojson.feature(data,data.objects.collection))
// 		 				.attr("class", "water")
// 		 				.attr("d",path);
// 		 });
// 		

		var tlast = [0,0], 
			slast = null;
	
		function redraw() {
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
					var b = mercatorBounds(projection, maxlat);
					if (b[0][1] + dy > 0) dy = -b[0][1];
					else if (b[1][1] + dy < height) dy = height-b[1][1];
					projection.translate([tp[0],tp[1]+dy]);
				}
				// save last values.  resetting zoom.translate() and scale() would
				// seem equivalent but doesn't seem to work reliably?
				slast = scale;
				tlast = t;
		
			}
	
			map.selectAll('path')       // re-project path data
				.attr('d', path);
		
		
			//console.log("current scale");    
			//console.log(zoom.scale()); // why does it keep adding?
	
			// console.log(d3.event.scale, d3.event.translate[0]); 
		}


		function resetZoom(){


			projection.rotate([rotate,0])
					.scale(1)           // we'll scale up to match viewport shortly.
					.translate([width/2, height/2])
					.center([0,30]);	
			
			var b = mercatorBounds(projection, maxlat),
					 s = width/(b[1][0]-b[0][0]),
					 scaleExtent = [s, 10*s];

				 projection
					 .scale(scaleExtent[0]);
	
			map.selectAll('path') // re-project path data
				.transition()
				.duration(2000) //transition not working      
				.attr('d', path);
	
			console.log("entered reset");//did enter
	
			redraw();
		}





		function choropleth(d, recolorMap){
			//Get data value
			var value = d.properties.category; //number 
					// value is undefined, why?... it worked in other map
			if (value) {
				return recolorMap(value);
			} else {
				return "black"; //only showing up black
			};
		};
		
		function choroplethDiversity(d, recolorMap){
			//Get data value
			var value = d.properties.subfamily; 
			if (value) {
				return recolorMap(value);
			} else {
				return "black"; //only showing up black
			};
		};
		
		function colorScaleDiversityView(){		
			
				var color = d3.scale.quantile() //designate quantile scale generator
				.range(diversityColorArray);
				
				var max = Math.max(arr);
		
				//set min and max data values as domain
				color.domain([0,max]);

				//return the color scale generator
				return color;	
		
		}

		//drawLegendCategory
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


		function centerOnBentity(bentity){
			//get the centroid of the bentity
			//set projection center to that, and set the scale and translation accordingly
		}

		
		//when this is called the map is not being updated
		// is it because my code isn't wrapped in a function?
	    function updateMapSubfamily(){
	    
	     d3.json("../data/bentities_highres_new.json", function(error, data){
	    		map.selectAll(".bentities")
				  	 							.data(topojson.feature(data,data.objects.bentities_Jan2015_highres).features)
				  	 							.enter()
				  	 							.append("path")
				  	 							.attr("class","bentities")
				  	 							.attr("d",path)
				  	 							.style("fill", function(d) { //color enumeration units
													return choroplethDiversity(d, colorScaleDiversityView()); 
										});
										
		});
	    	
	    }
	    
	    function updateMapGenus(){
	    }
	    
	    function updateMapLocation(){
	    }
	    
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
	    
	    