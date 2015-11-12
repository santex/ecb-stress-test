//the view that constructs a linechart
var BarChart = ChartBase.extend({
	defaults: _.defaults({
		someNewDefault: "yes"
	}, ChartBase.prototype.defaults),
	//setup the scales
	getXScale: function() {
		if (this.hasTimeScale == true){
				return d3.time.scale()
					.domain([
					    	d3.min(this.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get('date'); }); }),
							d3.max(this.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get('date'); }); })
					])
					.range([0, this.width - this.widthOfBar*this.numberOfObjects])
			}else{
				return d3.scale.ordinal()
				.domain(this.data.models[0].get('values').models.map(function(d) { return d.get('category')}))
				.rangeRoundBands([0, this.width], 0);
			}
	},
	getYScale: function() {
		if (this.autoScale == "yes" || this.hasZoom == "yes" || this.multiData == "yes"){
			//find the minimum value, if greater than 0, return 0
			var min = d3.min(this.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get(self.dataType); }); });
			if (min > 0){min = 0}
			return d3.scale.linear()
				.domain([min,d3.max(this.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get(self.dataType); }); }) ])
				.range([this.height, 0])
		}else{			
			return d3.scale.linear()
				.domain([this.yScaleVals[0],this.yScaleVals[this.yScaleVals.length - 1]])
				.range([this.height, 0])
		}
	},
	renderChart: function (){
		var self = this;
		//set data to the data in the model
		var data = this.data;
		//will use this variable to update to different types of data.
		var series; 
		//color scale based on the array of colors outlined in the options
		var color = d3.scale.ordinal().range(self.lineColors);
		//add a counter so that all the updates don't happen first go through.
		var Counter = 0;		

		//if there is multi data, this function will rerun the drawchart for everything that changes
		function change() {
			d3.transition()
			.duration(1500)
			.each(drawChart);
		}

		
		//if there is multidata, then tell the nav buttons how to change.
		if (self.hasMultiData == "yes"){
				d3.selectAll("#" + self.targetDiv + " .nav")
				.on("click", function() {  
	    			d3.selectAll("#" + self.targetDiv + " .nav")
	    				.classed('selected',false);
	    			
	    			d3.select(this)
	    				.classed('selected',true);		    			
	    	
		    		self.data= self[this.id] 
				    	change ();	
		      })
		}


		function drawChart (){	
			//holder for data that comes out on legend click
			var removedData=[];				        	
			//these aspects of the data will cahnge on update.
			self.numberOfObjects = self.data.models.length;
			self.widthOfBar = (self.width/(self.dataLength*self.numberOfObjects))-(self.width/(self.dataLength*self.numberOfObjects))*.2;
		    			

			if (self.hasMultiData == "yes"){
				//redudnant setting of the scales, but changes them if there is multi-data.
				if (self.hasTimeScale == true){
					self.scales.x.domain([
						    	d3.min(self.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get('date'); }); }),
								d3.max(self.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get('date'); }); })
						])
				}else{
					self.scales.x = d3.scale.ordinal()
					.domain(self.data.models[0].get('values').models.map(function(d) { return d.get('category')}))
					.rangeRoundBands([0, self.width], 0);
				}

				
				var min = d3.min(self.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get(self.dataType); }); });
				if (min > 0){min = 0}
				self.scales.y
					.domain([min, d3.max(self.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get(self.dataType); }); })])
					.range([self.height, 0])
			
			
				self.yAxis = d3.svg.axis()
			    	.scale(self.scales.y)
				    .orient("left")
				    .tickSize(0-self.width)
				    .ticks(5)
				    .tickPadding(8)
				    .tickFormat(function(d,i) {if (i == (self.scales.y.ticks(5).length) - 1){return self.YTickLabel[0] + d + self.YTickLabel[1]} return d});
			}			








			//enter g tags for each set of data, then populate them with bars.  some attribute added on end, for updating reasons
			var barChart = self.svg.selectAll(".barChart")
		      	.data(self.data.models, function(d) { return(d.get('name'));});
			
			var barChartEnter = barChart.enter().append("g")
		  	  	.attr("clip-path", "url(#clip" + self.targetDiv + ")")
		      	.attr("class", "barChart")
		      	.attr('id',function(d){ return self.targetDiv + d.get("name") + "-bar"; });

			barChart.selectAll(".bar")
			      .data(function(d) {return(d.get('values').models);})
			      .enter().append("rect")
			      .attr("class", "bar")
				  .style("fill", function (d) {
				  	if (self.colorUpDown == "yes"){
					  	if (d.get(self.dataType) > 0){
						  	return self.lineColors[0];
					  	}else{
						  	return self.lineColors[1]
					  	}					  						  	
				  	}else{
					  	return color(d.get("name"))
				  }
				  })
			      .attr("title", self.makeTip)
			      .attr("height", 0)
			      .attr("y", self.scales.y(0))
			      .attr("width", self.widthOfBar) 
				  .attr("x", function(d, i, j) { var theScale = 'category'; if (self.hasTimeScale == true) {theScale = 'date'} return (self.scales.x(d.get(theScale)) - (j*self.widthOfBar))+(self.widthOfBar*(self.numberOfObjects-1)) })
			      .transition()
			      .duration(1000)
			 	  .attr("y", function(d) { return self.scales.y(Math.max(0, d.get(self.dataType))); })
			 	  .attr("height", function(d) { return Math.abs(self.scales.y(d.get(self.dataType)) - self.scales.y(0)); });
				
								
				//make the dark zero axis on top
				var yAxiszero = d3.svg.axis()
			    	.scale(self.scales.y)
				    .orient("left")
				    .tickValues([0])
				    .tickSize(0-self.width)
				    .tickPadding(8)
				    self.svg.append("svg:g")
				    .attr("class", "y axiszero");
				
			    self.svg.select(".y.axiszero")
			    	.call(yAxiszero); 
					
					
				if (self.hasLegend == "yes"){		
				//append the legend
			    var legend = self.svg.selectAll('.legend')
			        .data(data.models, function(d) {return(d.get('name'));})
			    
			    //make a variable to figures out how many items are turned off, and adjusts the width of the bars based on it.
			    var legendEnter = legend    
			        .enter()
			        .append('g')
			        .attr('class', 'legend')
			        .attr('id',function(d){ return self.targetDiv+d.get('name'); })
			        .attr('data-id', function (d) {return d.get('name')})
			        .on('click', function (d) {                                  	       	
						if (self.hasMultiData =="yes"){return}
						if($(this).css("opacity") == 1){	
							var dataToSpike = $(this).attr("data-id");
				        	$.each(data.models, function(i) {					        
					        	if (data.models[i].get('name') == dataToSpike) {
						        	var holder = data.models.splice(i,1);
						        	removedData.splice(removedData.length,0,holder[0]) 
						        	return false;
					        	}						        	
				        	});
				        	//remove the spiked bars
				        	var tempEl = document.getElementById(this.id +"-bar");   					        	
				        	d3.select(tempEl)					       					        
					        	.remove();
					        	
				        	d3.transition()
								.duration(1500)
								.each(drawChart);
				        	
				        	d3.select(this)
								.classed('clicked',true);
						
																	
			      		} else {
			      			var dataToAdd = $(this).attr("data-id");
				        	$.each(removedData, function(i) {					        
					        	if (removedData[i].get("name") == dataToAdd) {
						        	var holder = removedData.splice(i,1);
						        	data.models.splice(data.models.length,0,holder[0]) 
						        	return false;
					        	}						        	
				        	});		      					        	
				        	
				        	d3.transition()
								.duration(1500)
								.each(drawChart);
								
				        	d3.select(this)
								.classed('clicked',false);
							}
				      	});
			
				//actually add the circles to the created legend container
			    legendEnter.append('circle')
			        .attr('cx', self.width + 20)
			        .attr('cy', function(d, i){ return (i *  25) + 3;})
			        .attr('r', 7)
			        .style('fill', function(d) { 
			          return color(d.get('name'));
			        });
			        	        	
				//add the legend text
			    legendEnter.append('text')
			        .attr('x', self.width+35)
			        .attr('y', function(d, i){ return (i *  25) + 9;})
			        .text(function(d){ return d.get('name'); });
			}	
			
			
			if (Counter > 0){
			 // Update the graph if the data changes.  first line
			var barChartUpdate = d3.transition(barChart);

			 
			barChartUpdate.selectAll(".bar")
						.attr("width", self.widthOfBar) 
						.attr("x", function(d, i, j) { var theScale = 'category'; if (self.hasTimeScale == true) {theScale = 'date'} return (self.scales.x(d.get(theScale)) - (j*self.widthOfBar))+(self.widthOfBar*(self.numberOfObjects-1)) })
					.attr("y", function(d) { return self.scales.y(Math.max(0, d.get(self.dataType))); })
			 	  .attr("height", function(d) { return Math.abs(self.scales.y(d.get(self.dataType)) - self.scales.y(0)); })
			 	  .style("fill", function (d) {
				  	if (self.colorUpDown == "yes"){
					  	if (d.get(self.dataType) > 0){
						  	return self.lineColors[0];
					  	}else{
						  	return self.lineColors[1]
					  	}					  						  	
				  	}else{
					  	return color(d.get("name"))
				  }
				  });
			  	  
		  	// update the axes,   
		    d3.transition(self.svg).select(".y.axis")
		    	.call(self.yAxis);   
		          
		    d3.transition(self.svg).select(".x.axis")
		        .attr("transform", "translate(0," + self.height + ")")
		        .call(self.xAxis);					
   	
			 
			    barChart.selectAll(".bar")
				.attr("title", self.makeTip);	
			
			}
			Counter++	  

			//make my tooltips work
			$('.bar').tipsy({opacity:.9, gravity:'sw', html:true});
			
	
			
		}
	
		drawChart ();

	}

});
