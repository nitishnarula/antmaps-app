

	//GLOBAL VARIABLES
	
	//to populate dropdown / autocomplete
	var subfamilyArray= ["Agroecomyrmecinae","Amblyoponinae","Aneuretinae","Dolichoderinae","Dorylinae","Ectatomminae","Formicinae","Heteroponerinae","Leptanillinae","Martialinae","Myrmeciinae","Myrmicinae","Paraponerinae","Ponerinae","Proceratiinae","Pseudomyrmecinae"];
	//sufamily array should be set as there are only 19 subfamilies...only 16 here (extant?)
	var genusArray=[];
	var speciesArray=[];
	var bentityArray= [];
	
	//to detect current mode: speciesMode, diversitySubfamilyMode, diversityGenusMode, diversityLocationMode
	var modes = ["speciesMode", "diversitySubfamilyMode", "diversityGenusMode", "diversityLocationMode"];
	var currentMode = modes[0]; // default is species mode. use switch statements to update "MAP" functionality according to mode
	
	var subfamilySelected;
	var genusSelected;
	var speciesSelected;
	var locationSelected; // or bentity selected
	
	var categoryArray=["endemic","native","unknown","dubious","non-native","invasive"];
	var categoryColor = ["#2166ac","#67a9cf","#d1e5f0","#fddbc7","#ef8a62","#b2182b"];
	var categoryColorScale =  d3.scale.ordinal().domain(categoryArray)
												.range(categoryColor);
												
	var diversityColorArray = ["#fef0d9","#fdd49e","#fdbb84","#fc8d59","#e34a33","#b30000"];
	var diversityColorScale;
	
	
	function initialize(){
	
	
	 loadDropdownSpeciesMode();// since this is the default mode it should be populated on load
	 loadDropdownDiversitySubfamilyMode();
	 
	 // Species Browse Button
	 	$("#browse").on("click",function(){
	 		$("#spp-browse-panel").css("opacity",1);
	 		$("#mapContainer").css("z-index",1);
	 		//for some reason the map is draw on top of the panel even though i set the z-index
	     });
	 		
	 	
	
	 /*  Script to switch views */
		$('.button-wrap').on("click", function(){
		  $(this).toggleClass('button-active');
		  $('#view-title').html($('#view-title').text() == 'Diversity View' ? 'Species View' : 'Diversity View');
		  
		  if($('.button-wrap').hasClass("button-active")){
			
			$("#spp_view").css("display","none");
			$("#diversity_view").css("display","inline");
			
			//to make the subfamily tab default and always the one active when switching views
			$(".diversity-button").removeClass("diversity-active");
			$("#diveristy-subfamily-button").addClass("diversity-active");		
			
			$("#diversity_subfamily").css("display","inline");
				$("#diversity_genus").css("display","none");
				$("#diversity_location").css("display","none");
				
				updateMapSubfamily();
						
		}else{
			
			$("#spp_view").css("display","inline");
			$("#diversity_view").css("display","none");
			
			
			currentMode = modes[0];
			//call function to populate dropdowns
			loadDropdownSpeciesMode();

		}
		  
		});	

		//diversity view 3-mode toggle	
			
			$(".diversity-button").on("click",function(){
				$(".diversity-button").removeClass("diversity-active");
				$(this).addClass("diversity-active");
				
				if($("#diveristy-subfamily-button").hasClass("diversity-active")){

				$("#diversity_subfamily").css("display","inline");
				$("#diversity_genus").css("display","none");
				$("#diversity_location").css("display","none");
				
				currentMode = modes[1];
				
				loadDropdownDiversitySubfamilyMode();
				updateMapSubfamily(); // not working

			}else if($("#diveristy-genus-button").hasClass("diversity-active")){
		
				$("#diversity_subfamily").css("display","none");
				$("#diversity_genus").css("display","inline");
				$("#diversity_location").css("display","none");
				
				currentMode = modes[2];

			}else if($("#diveristy-location-button").hasClass("diversity-active")){
				
				$("#diversity_subfamily").css("display","none");
				$("#diversity_genus").css("display","none");
				$("#diversity_location").css("display","inline");
				
				currentMode = modes[3];

			}else{
				
			}
			
		}); // end diversity-button on click
			
			
			
			

		};


			
		/*  Script to load dropdown */
		function loadDropdownSpeciesMode(){
		
			$('#subfamily-select').empty();
		
			for(var field=0; field<subfamilyArray.length;field++){
				  
				$('#subfamily-select').append(
			        $('<option></option>').val(subfamilyArray[field]).html(subfamilyArray[field])
			      );	     
			   
			}
			
			
			 $("#subfamily-select").change(function () {
			 	
			 	/* $('#genus-select').empty().append($('<option></option>').val('Select-Genus').html('Select Genus')); */
			 	
			 	subfamilySelected = $("#subfamily-select option:selected").text();
			 	
			 	
			 	//filter all records to find the ones where subfamily = selected  _.filter	
			 	
			 	//store all genus in one array	_.pluck or _.pick the genus property	 	
			 	
			 	//go over this list to find unique genera in the chosen subfamily    _.uniq
			 	
			 	
			 	//do the same for species
			 	
			 	
			 });
			 
		
			
		}
		
		function loadDropdownDiversitySubfamilyMode(){
		
			$('#subfamily-select2').empty();
		
			for(var field=0; field<subfamilyArray.length;field++){
				  
				$('#subfamily-select2').append(
			        $('<option></option>').val(subfamilyArray[field]).html(subfamilyArray[field])
			      );	     
			   
			}

			
		}
		
		function loadDropdownDiversityGenusMode(){
			
		}
		
		function loadBentityDropdown(){
			$('#bentity-select').empty();
		
			for(var field=0; field<bentityArray.length;field++){
				  
// 			"San Andres Providencia and Santa Catalina" 
// 			"South Georgia and the South Sandwich Is")

				$('#bentity-select').append(
			        $('<option></option>').val(bentityArray[field]).html(bentityArray[field])
			    );	
			      
		    }//end for     
		
			
				
		}
		
		
		function updateResults(){
		
			if(currentMode == "speciesMode"){
				subfamilySelected = $('#subfamily-select').val();
				genusSelected = $('#genus-select').val();
				speceisSelected = $('#species-select').val();	
			}else if(currentMode == "diversitySubfamilyMode"){
				subfamilySelected = $('#subfamily-select2').val();
			}else if(currentMode == "diversityGenusMode"){
				subfamilySelected = $('#subfamily-select3').val();
				genusSelected = $('#genus-select2').val();
			}else{
				//locationSelected=
			}
			
			
			//updateMap called by user clicking on map button
			
		
			
		}
		
		
		$( "select" ).on( "change", updateResults);
			updateResults();
		
		
		//should I have four updateMap functions, one for each mode?
		function updateSpeciesMap(){
			
			if(subfamilySelected == "Select Subfamily"){
				alert("Pick a Subfamily");
			}else if(genusSelected == "Select Genus"){
				alert("Pick a Genus");
			}else if(speciesSelected == "Select Species"){
				alert("Pick a Species");
			}else{
				//SUCCESS, so update map
				drawPointsSpeciesMap();
				updateColorSpeciesMap();
			}
			
			
		}
		
		
		function drawPointsSpeciesMap(){
			
		}
		function updateColorSpeciesMap(){
		}
		
		function diversityColorScale(){
		
		var color = d3.scale.quantile() //designate quantile scale generator
			.range([
				"#fcae91",
				"#fb6a4a",
				"#de2d26",
				"#a50f15"
			]);
		
		
		/* var max = d3.max(data, function(d) { return +d.species; }); */
			
			//set min and max data values as domain
		color.domain([0,max]);
	
		//return the color scale generator
		return color;	
	
		};
		

	
	$(document).ready(initialize());
