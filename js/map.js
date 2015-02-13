(function() {
		function draw(ht) {
		    $("#mapContainer").html("<svg id='map' xmlns='http://www.w3.org/2000/svg' width='100%' height='" + ht + "'></svg>");
		    var map = d3.select("svg");
		    var width = $("svg").parent().width();
		    var height = ht;
		
		    var projection = d3.geo.mercator()
						    .scale(200).translate([width/2, height/2]);
						   
			
			var graticule = d3.geo.graticule()
						    .step([20, 20]);
						    
			var path = d3.geo.path().projection(projection);
						    			
							map.append("path")
							    .datum(graticule)
							    .attr("class", "graticule")
							    .attr("d", path);
						    
						    var gratBackground=map.append("path")
						    	.datum(graticule.outline)
						    	.attr("class","gratBackground")
						    	.attr("d",path);
						    	
						    var gratLines=map.selectAll(".gratLines")
						    	.data(graticule.lines)
						    	.enter()
						    	.append("path")
						    	.attr("class","gratLines")
						    	.attr("d",path);
						    	
						    var g = map.append("g");
		
					   d3.json("../data/world.topojson", function(error, data){
				    
							   	var worldcountries= g.append("g")
							      .attr("class","countries")
							      .selectAll("path")
							      .data(topojson.feature(data,data.objects.countries).features)
							      .enter().append("path")
							      .attr("d", path);
							      
							   
							    g.append("path")
							      .datum(topojson.mesh(data,data.objects.countries, function(a, b) { return a !== b; }))
							      .attr("class", "country-borders")
							      .attr("d", path);
							 
							
		
					   });//end d3.json
		
		}
		
		draw($("#mapContainer").width()/1.4);
		//apect ratio of mercator projection is 1.65
		//1000 x 606
		
		
		$(window).resize(function() {
		    if(this.resizeTO) clearTimeout(this.resizeTO);
		    this.resizeTO = setTimeout(function() {
		        $(this).trigger('resizeEnd');
		    }, 500);
		});
		
		
		
		$(window).bind('resizeEnd', function() {
		    var height = $("#mapContainer").width()/1.4;
		    $("#mapContainer svg").css("height", height);
		    draw(height);
		});

})();	