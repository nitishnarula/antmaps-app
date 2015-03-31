
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

