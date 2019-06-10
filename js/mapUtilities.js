//////////////////////////////////////////////////////////////////////////
// MAP UTILITIES
//
// External functions: datatest, infoLabel, removeInfoLabel, infoPanelPoints,
//				       openInfoPanel, setTitle, logBinColorScale, drawLegend
//////////////////////////////////////////////////////////////////////////

var mapUtilities = (function() {
	var external = {};




	// Renders an info label for a bentity or point.
	// D is the D3-bound data, i is a unique ID for the bentity or point, j is given by D3 but not used.
	// labelHTMLoption is an optional argument containing the HTML to show in the label.
	// If labelHTMLoption is not supplied, call the current mode's bentityInfoLabelHTML function.
	external.infoLabel = function(d, i, j, labelHTMLoption){

		var labelHTML = labelHTMLoption;

		if (labelHTMLoption === undefined) {
			labelHTML = controls.getCurrentModeObject().bentityInfoLabelHTML(d, i);
		} // there is a bentityInfoLabelHTML function in each mode

		mapUtilities.removeInfoLabel(); // clear already-existing label

		var infolabel = d3.select("body").append("div")
			.attr("class", "infolabel") //for styling
			.attr("id", "infolabel-" + i) // to remove label
			.html(labelHTML); //add text

	};
	baseMap.addBentityEventListner('mouseenter.infolabel', external.infoLabel);




	external.removeInfoLabel = function(d, i) {
		if (i === undefined) {
			// if removeInfoLabel was not called as an event handler, i will not be present, so remove all info lables
			d3.select(".infolabel").remove();
		}
		else {
			// if removeInfoLabel is called as an event handler, i will be present, so remove only the div with i in the ID to prevent glitches with mouseover/mouseout timing
			d3.select("#infolabel-" + i).remove();
		}
	};
	baseMap.addBentityEventListner('mouseleave.infolabel', external.removeInfoLabel);




	// Open an overlay on top of the map
	// Return a D3 selection of a div that you can use to append content to the
	// info panel.
	external.openInfoPanel = function() {
		var panelOverlay = d3.select("body").append("div")
		.attr("class", "infopanel-overlay") //set z-index higher than title
		.on("click", external.closeInfoPanel);

		var infoPanel = panelOverlay.append("div")
			.attr("class", "infopanel") //for styling label
			.on("click", function(){ d3.event.stopPropagation(); }); // keep click event from bubbling up

		//add if statement here to detect if it is diversityBentity Mode, if it is, then add "map xxx" button
		// if it is already in the choropleth mode


		// close-info-panel button
		infoPanel.append("div")
		.attr("class","close-info")
		.attr("id","close-info")
		.text("x")
		.on("click", external.closeInfoPanel);

		var infoPanelContent = infoPanel.append("div").attr("class", "infopanel-content")
		.html('Loading...');

		return infoPanelContent;
	};




	// Close info panel
	external.closeInfoPanel = function() {
		d3.select(".infopanel-overlay").remove();
	}




	// Given a container (D3-selection) and a list of species, append a UL with a list
	// of species to the container.  Species should be a list of {key:xxx, display:xxx}.
	external.appendSpeciesList = function(container, species) {
		var ul = container.append("ul");

		ul.classed("species-list", true)
			.selectAll("li")
			.data(species)
			.enter()
				.append("li")
				.text(function(d) {return d.display})
				.on("click", function(d) {
					external.closeInfoPanel();
					controls.setMode("speciesMode");
					controls.getCurrentModeObject().updateData(
						{taxon_code:d.key, speciesName:d.display});

					//console.log(d.display);
					//var fullName = d.display;
					//var genus = fullName.substr(0,fullName.indexOf(' '));


					//$("#sppView-genus-select").val(genus);
					//$("#sppView-species-select").prop('disabled',false);
					//$("#sppView-species-select").val(fullName);

					//problem: genus called via ajax based on subfamily
					// and species called via ajax based on genus

					baseMap.resetZoom();
				});
	};



	external.appendCitations = function(container, record){

		var ul=container.append("ul");

		ul.classed("record-list", true)
			.selectAll("li")
			.data(record)
			.enter()
				.append("li")
				.html(function(d) {
				if(d.type_of_data == "Museum Specimen")
				{	d.type_of_data="Museum";
				}

				return "<span class='gabi_acc'>"+d.gabi_acc_number+"</span> <span class='type_data'>("+d.type_of_data+")</span><span class='short_citation'>"+d.citation+"</span>";})
				.on("click", function(d) {
					external.closeInfoPanel();
					baseMap.resetZoom();
				});


	};




	// sets the title for the current mode and displays the current selection
	external.setTitle = function(currentMode, currentSelection){

			var currentTitleText;

			if(currentMode != "Overall Species Richness"){
				currentTitleText = "Current "+ currentMode;
			}else{
				currentTitleText = "Overall Species Richness"
			}


			var currentSelectionText =currentSelection;

			$('#current-selection-title').html(currentTitleText);
			$('#current-selection').html(currentSelectionText);

			if(currentMode == "Species" || currentMode == "Genus"){
				$('#current-selection').addClass('italic');
			}else{
				$('#current-selection').removeClass('italic');
			}


	};


	//sets the a href attributes for the current selection in order to link to the corresponding
	//pages on AntWeb and AntWiki
	external.setLinks = function(currentRank, currentSpecies,currentGenus,currentSubfamily){
		var currentRank,
		    antWebLink,
		    antWikiLink;

		    if(currentRank == "Subfamily"){

		    	antWebLink="http://www.antweb.org/description.do?subfamily="+currentSubfamily.toLowerCase()
		    		+"&rank="+currentRank.toLowerCase()+"&project=allantwebants";
		    	$("#antWeb").parent().attr('href',antWebLink);

		    	antWikiLink="http://www.antwiki.org/wiki/"+currentSubfamily.toLowerCase();
		    	$("#antWiki").parent().attr('href',antWikiLink);

		    }else if(currentRank == "Genus"){

		    	antWebLink="http://www.antweb.org/description.do?subfamily="+currentSubfamily.toLowerCase()
		    		+"&genus="+currentGenus.toLowerCase()+"&rank="+currentRank.toLowerCase()+"&project=allantwebants";
		    	$("#antWeb").parent().attr('href',antWebLink);

		    	antWikiLink="http://www.antwiki.org/wiki/"+currentGenus.toLowerCase();
		    	$("#antWiki").parent().attr('href',antWikiLink);

		    }else if(currentRank == "Species"){

		    	//console.log("setLinks species rank");

		    	var currentSpeciesArray = currentSpecies.split(" ");

		    	if(currentSpeciesArray.length==2){ //for species only, not subspecies

					currentSpecies = currentSpeciesArray[1];

					antWebLink="http://www.antweb.org/description.do?subfamily="+currentSubfamily.toLowerCase()
		    		+"&genus="+currentGenus.toLowerCase()+"&species="+currentSpecies.toLowerCase()
		    		+"&rank="+currentRank.toLowerCase()+"&project=allantwebants";
		    		$("#antWeb").parent().attr('href',antWebLink);

					antWikiLink="http://www.antwiki.org/wiki/"+currentGenus+"_"+currentSpecies;
					$("#antWiki").parent().attr('href',antWikiLink);


		    	}else if(currentSpeciesArray.length==3){ //case for subspecies

					currentSpecies = currentSpeciesArray[1];
					var currentSpecies2 = currentSpeciesArray[2];

					antWebLink="http://www.antweb.org/description.do?subfamily="+currentSubfamily.toLowerCase()
		    		+"&genus="+currentGenus.toLowerCase()+"&species="+currentSpecies.toLowerCase()+"&subspecies="+currentSpecies2
		    		+"&rank=subspecies&project=allantwebants";
		    		$("#antWeb").parent().attr('href',antWebLink);

					antWikiLink="http://www.antwiki.org/wiki/"+currentGenus+"_"+currentSpecies+"_"+currentSpecies2;
					$("#antWiki").parent().attr('href',antWikiLink);
		    	}



		    }
	};



	// color scale generator for choropleth
	external.logBinColorScale = function(maxSpecies, zeroColor, colorArray) {

		var continuousScale;
		if (maxSpecies > colorArray.length) {
			// Use log scale if there are more domain values than colors
			// maxSpecies+0.0001 so the output is never colorArray.length, so we don't overstep the color array
			// domain of log scale can never be 0
			continuousScale = d3.scale.log().domain([1, maxSpecies+0.0001]).range([0, colorArray.length]);
		}
		else {
			// Use a linear scale if there are more (or same number) colors than domain values
			continuousScale = d3.scale.linear().domain([1, maxSpecies+0.0001]).range([0, maxSpecies]);
		}


		// convert log value to color
		var colorscale = function(x) {
			if (x==0) {
				return zeroColor;
			}
			else {
				// round log value down to nearest integer to get colors
				return colorArray[Math.floor(continuousScale(x))];
			}
		}


		// return an array of labels for the legend  (call like logBinColorScale().binLabels)
		colorscale.binLabels = function() {

			// get the boundries of the different color categories
			var boundries = [0];
			for (var y = 1; y < colorArray.length && y < maxSpecies; y++) {
				boundries.push(Math.floor(continuousScale.invert(y)));
			}
			boundries.push(maxSpecies);

			// make string labels for each color category
			var binLabels = ['0'];
			for (var b = 0; b < boundries.length - 1; b++) {
				if (boundries[b] == boundries[b+1] || (boundries[b] + 1) == boundries[b+1]) {
					binLabels.push(boundries[b+1]);
				}
				else {
					binLabels.push((boundries[b] + 1) + ' ~ ' + boundries[b+1]);
				}
			}

			return binLabels;
		}

		return colorscale;
	};



	// Renders the legend -- "legendContainer" is the D3 selection in which to
	// put the legend, "legendLabels" is an array with the legend labels,
	// and "legendColors" is an array with HTML color codes.
	// The legend will have as many rows as legendLabels.length
	external.drawLegend = function (legendContainer, legendLabels, legendColors) {

		//console.log("legendContainer");
		//console.log(legendContainer[0][0].id);
		//console.log(legendLabels);


		// remove previously-existing legend
		legendContainer.selectAll('div.legendRow').remove();


 		if (legendContainer[0][0].id == "species-legend"){
//
		var legendTooltip = ["Records that are considered native","Data that represent non-native species records with established populations in the wild",
			"Data that represent non-native species records without established populations in the wild","Uncertain records in need of verification to be classified as valid or dubious.",
			"Erroneous records reported in previous publications or databases but later identified as misidentifications"];
		legendContainer.selectAll('div.legendRow')
			.data(legendLabels)
			.enter()
			.append('div')
			.attr('class', 'legendRow')
			.each(function(d, i) {
				// add color box and label to each row
				//console.log(this);
 				//console.log(i);
				d3.select(this).append('div')
					.attr("class","colorbox").attr('id','colorbox-'+i)
						.style("background-color", legendColors[i])
						.style("opacity",0.7);
				d3.select(this).append('span').text(d);


				d3.select(this).append('div').attr('class','legendTooltip')
				.attr('id','tooltip-'+i).style("visibility", "hidden");

				d3.select('#'+'tooltip-'+i).text(legendTooltip[i]);
				d3.select(this) // "#"+"colorbox"+i
				.on('mouseover', function(){
 						return d3.select('#'+'tooltip-'+i).style("visibility", "visible").text(legendTooltip[i]);


 					})
 				.on('mouseout',function(){
 					return d3.select('#'+'tooltip-'+i).style("visibility", "hidden");
 				})

			});

		}else{

				// create a div for each legend item (color + label)
		legendContainer.selectAll('div.legendRow')
			.data(legendLabels)
			.enter()
			.append('div')
			.attr('class', 'legendRow')
			.each(function(d, i) {
				// add color box and label to each row
				//console.log(this);
				//console.log(i);
				d3.select(this).append('div')
					.attr("class","colorbox")
						.style("background-color", legendColors[i])
						.style("opacity",0.7);
				d3.select(this).append('span').text(d);

			});

		}
	}






	return external;
})();
