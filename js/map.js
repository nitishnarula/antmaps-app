var arr = [];
for (var i = 0, l = 40; i < l; i++) {
    arr.push(Math.round(Math.random() * l))
    // console.log(arr[i]);
}



//sets basemap
function setMap(){


		
		 var width = $("#mapContainer").parent().width();
		 var height= 750;
		 
		 var  rotate = 60;        // so that [-60, 0] becomes initial center of projection
         var  maxlat = 83;        // clip northern and southern poles (infinite in mercator)
		 
				
		 // var projection = d3.geo.mercator()
// 			    .scale((width+1)/2/Math.PI)
// 			    .center([370, 38])
// 			    .translate([width / 2, height / 2])
// 			    .precision(.1);
			    
			    
		 var projection = d3.geo.mercator()
    		.rotate([rotate,0])
    		.scale(1)           // we'll scale up to match viewport shortly.
   			.translate([width/2, height/2]);	    
   			
   			
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
			
		 var map= d3.select("#mapContainer")
				.append("svg")
				.attr("width",width)
				.attr("height",height)
				.attr("id","map")
				// .append("g")
//     			.call(d3.behavior.zoom().scaleExtent([1, 8]).center(center).on("zoom", zoom))
//  				.append("g");
				.call(zoom);	
			
		//UNCOMMENT IF WANT RASTOER VECTOR ZOOM	(1)	
		 // var center = projection([370, 38]);		
				
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
			    	
		   
		   function zoom() {
		   
				
  				map.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
			}
		   
		   //UNCOMMENT IF WANT RASTOER VECTOR ZOOM (2)
		   // var tile = d3.geo.tile()
//     			.size([width, height]);
//     			
//     	   var zoom = d3.behavior.zoom()
//     		.scale(projection.scale() * 2 * Math.PI)
//     		.scaleExtent([1 << 10, 1 << 14])  // originally was 11 instead of 10
//     		.translate([width - center[0], height - center[1]])
//     		.on("zoom", zoomed);
//     			
//     		var raster = map.append("g");
// 			var vector = map.append("path");

			
		    	
	    d3.json("../data/bentities_highres.json", function(error, data){
	    			//bentities.geojson
				   	//world.topojson
							
								  	
					//UNCOMMENT IF WANT RASTOER VECTOR ZOOM	 (3)		  	
					//map.call(zoom);
  					
  							  	
				  	
				  	 var bentities = topojson.feature(data,data.objects.bentities_Jan2015_highres).features;
				  	//data.objects.countries.geometries
					//var bentities = data.features;
					
					
				  		  console.log("bentities.length");
				  		  console.log(bentities.length);//534 for low res, 527 for high res
				  		  console.log(categoryArray);
				  		  
				  	 	  
				  	  	
				  		  
				  	 _.each(bentities, function(bentity){
				  	 	//console.log(bentity.properties.BENTITY);
				  	 	var category = categoryArray[Math.floor(Math.random()*categoryArray.length)];
				  	 	//randomly assign a category to the newly created category property for each bentity 
				  	 	_.extend(bentity.properties,{"category":category});
				  	 	//console.log(bentity.properties.category);
				  	 	// var number = arr[Math.floor(Math.random()*arr.length)];
// 				  	 	_.extend(bentity.properties,{"number":number});
				  	 	});
				  	 	
				  	
				  	 	
				  	 	
				  	 	//UNCOMMENT IF WANT RASTOER VECTOR ZOOM (4)
				  	 	//vector.datum(topojson.mesh(data, data.objects.bentities_Jan2015_highres));
				  	 	
				  	  var bentitiesMapped = map.selectAll(".bentities")
				  	 							.data(topojson.feature(data,data.objects.bentities_Jan2015_highres).features)
				  	 							//.data(data.features)
				  	 							.enter()
				  	 							.append("path")
				  	 							.attr("class","bentities")
				  	 							.attr("d",path)
				  	 							.style("fill", function(d) { //color enumeration units
													return choropleth(d, categoryColorScale); //colorScale()
										});
				  	 							
				  	 //UNCOMMENT IF WANT RASTOER VECTOR ZOOM (5)							
				  	 //zoomed();	
				  	 
				  	 redraw();  

		   });//end d3.json
		   
		   
		   
		   
		//UNCOMMENT IF WANT RASTOER VECTOR ZOOM (6)
		// function zoomed() {
//   			var tiles = tile
//      		 .scale(zoom.scale())
//      		 .translate(zoom.translate())
//      			 ();
// 
//  			 projection
//     		  .scale(zoom.scale() / 2 / Math.PI)
//      			 .translate(zoom.translate());
// 
// 			  vector
//    			   .attr("d", path);
// 
//  			 var image = raster
//       			.attr("transform", "scale(" + tiles.scale + ")translate(" + tiles.translate + ")")
//     			.selectAll("image")
//       			.data(tiles, function(d) { return d; });
// 
//   			image.exit()
//       			.remove();
// 
//   			image.enter().append("image")
//     		  .attr("xlink:href", function(d) { return "http://" + ["a", "b", "c", "d"][Math.random() * 4 | 0] + ".tiles.mapbox.com/v3/examples.map-i86nkdio/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
//       		  .attr("width", 1)
//               .attr("height", 1)
//               .attr("x", function(d) { return d[0]; })
//               .attr("y", function(d) { return d[1]; });
// 		   
// 			}

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
}

}//end setMap()


//test
function colorScale(){	
	var color = d3.scale.quantile() //designate quantile scale generator
		.range([
			"#fcae91",
			"#fb6a4a",
			"#de2d26",
			"#a50f15"
		]);
	var max = Math.max(arr);
		
		//set min and max data values as domain
	color.domain([0,max]);

	//return the color scale generator
	return color;	
};


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






$(document).ready(setMap());


