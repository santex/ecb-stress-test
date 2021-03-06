var pollChart = ChartBase.extend ({
	defaults: _.defaults({
		someNewDefault: "yes"
	}, ChartBase.prototype.defaults),
	//setup the scales.  You have to do this in the specific view, it will be called in the chartbase.
	getXScale: function() {
		return d3.time.scale()
			.domain([
			    	d3.min(this.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get('date'); }); }),
					d3.max(this.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get('date'); }); })
			])
			.range([0, this.width]);
	},
	getYScale: function() {
		if (this.autoScale == "yes" || this.hasZoom == "yes" || this.multiData == "yes"){
			return d3.scale.linear()
				.domain([
				    d3.min(this.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get(self.dataType); }); }),
			    	d3.max(this.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get(self.dataType); }); })
			    ])
				.nice()
				.range([this.height, 0])
		}else{			
			return d3.scale.linear()
				.domain([this.yScaleVals[0],this.yScaleVals[this.yScaleVals.length - 1]])
				.nice()
				.range([this.height, 0])
		}
	},
	renderChart: function (){
		
		// create a variable called "self" to hold a reference to "this"
		var self = this;
		//set data to the data in the model
		var data = this.data;
		
		for (i=0; i<self.data.models[0].get("values").models.length; i++){
			self.data.models[0].get("values").models[i].set({othervalue:self.data.models[1].get("values").models[i].get("value") })
			
		}
		
		//will use this variable to update to different types of data.
		var series; 
		//color scale based on the array of colors outlined in the options
		var color = d3.scale.ordinal().range(self.lineColors);
		
		//if there is multi data, this function will rerun the drawchart for everything that changes
		function change() {
			d3.transition()
			.duration(1500)
			.each(drawchart);
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
		
		//draws teh chart, gets rerun if there is multi-data		
		function drawchart (){	
			
			if (self.hasMultiData == "yes"){
				//redudnant setting of the scales, but changes them if there is multi-data.
				self.scales.x.domain([
			    	d3.min(self.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get('date'); }); }),
					d3.max(self.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get('date'); }); })
				])			
				self.scales.y.domain([
				    d3.min(self.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get(self.dataType); }); }),
			    	d3.max(self.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get(self.dataType); }); })
			    ])
			}
				
			//if there is a zoom, then setup the zoom
			if (self.hasZoom == "yes"){								
				//define the zoom
				var zoom = d3.behavior.zoom()
			    	.x(self.scales.x)
				    .y(self.scales.y)
				    .scaleExtent([1,8])
				    .on("zoom", zoomed);
			
				//call the zoom on the SVG
			    self.svg.call(zoom);
			
				//define the zoom function
				function zoomed() {
			    	
			    	self.svg.select(".x.axis").call(self.xAxis);
				    self.svg.select(".y.axis").call(self.yAxis);
			
					self.svg.selectAll(".tipCircle")
						.attr("cx", function(d,i){return self.scales.x(d.get('date'))})
						.attr("cy",function(d,i){return self.scales.y(d.get(self.dataType))});
						
					self.svg.selectAll(".line")
			    		.attr("class","line")
			        	.attr("d", function (d) { return line(d.get('values').models)});
					
					var recessionDateParse = d3.time.format("%m/%d/%Y").parse;
					self.svg.selectAll(".recessionBox")
						.attr("x", function (d) {  return self.scales.x(recessionDateParse(d.start))})
						.attr("width", function (d) {return (self.scales.x(recessionDateParse(d.end))) - (self.scales.x(recessionDateParse(d.start)))});
				}								
						
			}			 
		    			

			//will draw the line		
			var line = d3.svg.line()
		    	.x(function(d) { return self.scales.x(d.get('date')); })
			    .y(function(d) { return self.scales.y(d.get(self.dataType)); })
				.interpolate (self.lineType);
			
			var area = d3.svg.area()
		    	.x(function(d) { return self.scales.x(d.get('date')); })
		    	.y0(function(d) { return self.scales.y(d.get('othervalue'));  })
		    	.y1(function(d) { return self.scales.y(d.get('value')); });
			
			var areaChart = self.svg.selectAll(".areaChart")
		      	.data([self.data.models[0]], function(d) {return(d.get('name'))});
		 
			 
			var areaChartEnter = areaChart.enter().append("g")
		  	  	.attr("clip-path", "url(#clip" + self.targetDiv + ")")
		      	.attr("class", "areaChart")
									          
				areaChartEnter.append("path")
					.attr("class", "area")
			      	.attr("d", function(d) {return area(d.get('values').models); })


			//bind the data
			var lineChart = self.svg.selectAll(".lineChart")
		      	.data(self.data.models, function(d) {return(d.get('name'))});

			 
			//append a g tag for each line and set of tooltip circles and give it a unique ID based on the column name of the data     
			var lineChartEnter = lineChart.enter().append("g")
		  	  	.attr("clip-path", "url(#clip" + self.targetDiv + ")")
		      	.attr("class", "lineChart")
		      	.attr('id',function(d){ return self.targetDiv + d.get("name") + "-line"; })
		      	.on("mouseover", function (d){
			      	d3.selectAll("#" + self.targetDiv + " .lineChart")
    					.classed('notSelected', true);
    				d3.select(this)
    					.classed("notSelected", false);	
			      	
		      	})
		      	.on("mouseout", function (d){
			      	d3.selectAll(".lineChart")
    					.classed('notSelected', false);
		      	});
		
			//actually append the line to the graph
		  	lineChartEnter.append("path")
				.attr("class", "line")
		      	.style("stroke", function(d) { return color(d.get("name")); })
		      	.attr("d", function(d) {return line(d.get('values').models); })
		      			  
				


			var barChart = self.svg.selectAll(".barChart")
		      	.data([self.data.models[0]]);
			
			var barChartEnter = barChart.enter().append("g")
		  	  	.attr("clip-path", "url(#clip" + self.targetDiv + ")")
		      	.attr("class", "toolTipChart")

			barChart.selectAll(".tipBar")
			      .data(function(d) {return(d.get('values').models);})
			      .enter().append("rect")
			      .attr("class", "tipBar")
				  .style("fill", white)
				  .style("opacity", 1e-6)
			      .attr("height", self.height)
			      .attr("y", 0)
			      .attr("width", function(d){
			      	return self.width/self.data.models[0].get('values').models.length
			      })
				  .attr("x", function(d) {
				  	return (self.scales.x(d.get("date"))-((self.width/self.data.models[0].get('values').models.length)/2))
			 	  })
			 	  //THIS IS WHERE YOU CHANGE TOOLTIP CONTENT
			 	  .on("mouseover", function(d,i){				 	  				 	  
				 	   var yesIndex;
				 	   var noIndex;
				 	   if (self.data.models[0].get("name")== "Yes"){
					 	   yesIndex = 0;
					 	   noIndex = 1;
				 	   }else{
					 	   yesIndex = 1;
					 	   noIndex =0;
				 	   }
				 	   
				 	   self.tooltipYes.transition()
			          	.duration(200)
			          	.style("opacity", .9);			          	
			          self.tooltipYes.html("<div class='tooltip1'>"+self.data.models[yesIndex].get("name") +"</div><div class='tooltip2'>"+self.data.models[yesIndex].get("values").models[i].get("value")+"%</div>")
			              .style("left", (self.scales.x(self.data.models[yesIndex].get("values").models[i].get("date")))-30 + "px")
			              .style("top", (self.scales.y(self.data.models[yesIndex].get("values").models[i].get("value")))+self.margin.top+20 + "px");

				 	   self.tooltipNo.transition()
			          	.duration(200)
			          	.style("opacity", .9);
			          self.tooltipNo.html("<div class='tooltip1'>"+self.data.models[noIndex].get("name") +"</div><div class='tooltip2'>"+self.data.models[noIndex].get("values").models[i].get("value")+"%</div>")
			              .style("left", (self.scales.x(self.data.models[noIndex].get("values").models[i].get("date")))-30 + "px")
			              .style("top", (self.scales.y(self.data.models[noIndex].get("values").models[i].get("value")))+self.margin.top+13 + "px");
		      
				 	   self.tooltipDK.transition()
			          	.duration(200)
			          	.style("opacity", .9);
			          self.tooltipDK.html("<div class='tooltip1'>"+self.data.models[2].get("name") +"</div><div class='tooltip2'>"+self.data.models[2].get("values").models[i].get("value")+"%</div>")
			              .style("left", (self.scales.x(self.data.models[2].get("values").models[i].get("date")))-95 + "px")
			              .style("top", (self.scales.y(self.data.models[2].get("values").models[i].get("value")))+self.margin.top+21 + "px");
		      
		      
		      
		      })
			  .on("mouseout", function(d) {
		    	//turn off the paths.
			    self.tooltipYes.transition()
					.duration(500)
					.style("opacity", 0);
			    self.tooltipNo.transition()
					.duration(500)
					.style("opacity", 0);
			    self.tooltipDK.transition()
					.duration(500)
					.style("opacity", 0);
			  })

			 	  
			 	  
				
			if (self.hasLegend == "yes"){		
				//append the legend
			    var legend = self.svg.selectAll('.legend')
			        .data(self.data.models, function(d) {return(d.get('name'));})
			        
			    var legendEnter = legend    
			        .enter()
			        .append('g')
			        .attr('class', 'legend')
			        .attr('id',function(d){ return self.targetDiv+d.get('name'); })
			        .on('click', function (d) {                                  	       	
						if($(this).css("opacity") == 1){	
							var tempEl = document.getElementById(this.id +"-line");   					        	
				        	d3.select(tempEl)
					        	.transition()
					        	.duration(250)
					        	.style("opacity",0)
					        	.transition()
					        	.style("display","none");					        	
				        	d3.select(this)
								.classed('clicked',true);									
			      		} else {
			      			var tempEl = document.getElementById(this.id +"-line");
				        	d3.select(tempEl)
					        	.style("display","block")
					        	.transition()
					        	.duration(250)
					        	.style("opacity",1);				        	
				        	d3.select(this)
								.classed('clicked',false);}
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
			
				
				
			//make my tooltips work
			$('.tipBar').tipsy({opacity:.9, gravity:'n', html:true});
			
			
			//if there is multidata, all this will make the lines update.
			if (self.hasMultiData == "yes"){

					 var lineChartUpdate = d3.transition(lineChart);
    
				    // change values of path and then the circles to those of the new series
				    lineChartUpdate.select("path")
				      .attr("d", function(d,i) { 
				      			return line(d.get('values').models); });
				      				  
					 
					 //put the new tooltip values on seperate from the transition so no weird numbers
					 d3.selectAll("#" + self.targetDiv + " .tipCircle") 
					  .attr ("title", self.makeTip);
					  
					 // and now for legend items
					 var legendUpdate = d3.transition(legend);
					  
					 legendUpdate.select("circle")
						.attr('cy', function(d, i){ return (i *  25) + 3;});
				
					 legendUpdate.select("text")
					  	.attr('y',  function(d, i){ return (i *  25) + 9;});  
				
				  	// update the axes,   
				    d3.transition(self.svg).select(".y.axis")
				    	.call(self.yAxis);   
				          
				    d3.transition(self.svg).select(".x.axis")
				        .attr("transform", "translate(0," + self.height + ")")
				        .call(self.xAxis);					
				}
			
			
		}

		drawchart();
	}

});