
//the view that constructs a linechart
var sectorChart = ChartBase.extend({
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
					.range([0, this.width/(this.data.models.length*(1+(2/this.data.models[0].get('values').models.length)))])
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
		//will use this variable to update to different types of data.
		var series; 
		//color scale based on the array of colors outlined in the options
		var color = d3.scale.ordinal().range(self.lineColors);
		//add a counter so that all the updates don't happen first go through.
		var Counter = 0;		
		self.numberOfObjects = self.data.models.length;
		self.widthOfBar = (self.width/(self.dataLength*self.numberOfObjects))-(self.width/(self.dataLength*self.numberOfObjects))*.2;		
		self.eachChartWidth = self.width/self.numberOfObjects;
		
		
		
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

		
		
		self.svg.selectAll(".x.axis")
			.remove()
		
		
		self.svg.selectAll(".recession")
			.remove()
		
		
		function drawChart (){	
				//redudnant setting of the scales, but changes them if there is multi-data.
				self.scales.x.domain([
			    	d3.min(self.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get('date'); }); }),
					d3.max(self.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get('date'); }); })
				])			
				
				var min = d3.min(self.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get(self.dataType); }); });
				if (min > 0){min = 0}
				self.scales.y
					.domain([min, d3.max(self.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get(self.dataType); }); })])
					.range([self.height, 0])
			
			
				self.chartScaleRange = []
				
				for (i = 0; i<self.numberOfObjects; i++){
					self.chartScaleRange[i]=self.eachChartWidth*i;
				}
			
				self.barchartScales = d3.scale.ordinal()
		    	.domain(self.data.models.map(function(d) { return d.get('name'); }))
				.range(self.chartScaleRange)
			
						
			
					
			//enter g tags for each set of data, then populate them with bars.  some attribute added on end, for updating reasons
			var barChart = self.svg.selectAll(".barChart")
		      	.data(self.data.models, function(d) { return(d.get('name'));});
			
			var barChartEnter = barChart.enter().append("g")
		  	  	.attr("clip-path", "url(#clip" + self.targetDiv + ")")
		      	.attr("class", "barChart")
		      	.attr('id',function(d){ return self.targetDiv + d.get("name") + "-bar"; })
			  	.attr("transform", function(d,i){
				  	return 	"translate(" + self.barchartScales(d.get("name")) + ",0)"
				  	
			  	})
			  	
  
			  
			  	    //put in the recessions, if there are any.
		if (self.hasRecessions == "yes"){
			var recessionDateParse = d3.time.format("%m/%d/%Y").parse;
			var recessionData = [{"recess":[{"start":"5/1/1937","end":"6/1/1938"},{"start":"2/1/1945","end":"10/1/1945"},{"start":"11/1/1948","end":"10/1/1949"},{"start":"7/1/1953","end":"5/1/1954"},{"start":"8/1/1957","end":"4/1/1958"},{"start":"4/1/1960","end":"2/1/1961"},{"start":"12/1/1969","end":"11/1/1970"},{"start":"11/1/1973","end":"3/1/1975"},{"start":"1/1/1980","end":"7/1/1980"},{"start":"7/1/1981","end":"11/1/1982"},{"start":"7/1/1990","end":"3/1/1991"},{"start":"3/1/2001","end":"11/1/2001"},{"start":"12/1/2007","end":"6/1/2009"}]}];	
			
			
			var recessions = barChart.selectAll('.recession')
				.data (recessionData);
				
			var recessionsEnter = recessions.enter().append('g')
				.attr("clip-path", "url(#clip" + self.targetDiv + ")")
				.attr("class","recession")
				.attr("display", "block");
		
			recessions.selectAll("rect")
				.data( function(d) {return(d.recess);} )
				.enter()
				.append("rect")
				.attr("class", "recessionBox")
				.attr("x", function (d) {  return self.scales.x(recessionDateParse(d.start))})
				.attr("y", 0)
				.attr("width", function (d) {return (self.scales.x(recessionDateParse(d.end))) - (self.scales.x(recessionDateParse(d.start)))})
				.attr("height",self.height);
		}	
			  

			barChart.selectAll(".bar")
			      .data(function(d) {return(d.get('values').models);})
			      .enter()
			      .append("rect")
			      .attr("class", "bar")
				  .style("fill", function (d) {return color(d.get("name"))})			
			      .attr("title", self.makeTip)
			      .attr("height", 0)
			      .attr("y", self.scales.y(0))
			      .attr("width", self.widthOfBar) 
				  .attr("x", function(d, i, j) { var theScale = 'category'; if (self.hasTimeScale == true) {theScale = 'date'} return (self.scales.x(d.get(theScale)) ) })
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
			        .data(self.data.models, function(d) {return(d.get('name'));})
			    
			    //make a variable to figures out how many items are turned off, and adjusts the width of the bars based on it.
			    var legendEnter = legend    
			        .enter()
			        .append('g')
			        .attr('class', 'legend')
			        .attr('id',function(d){ return self.targetDiv+d.get('name'); })
			        .attr('data-id', function (d) {return d.get('name')});
			        
			
				
			        	        	
				//add the legend text
			    legendEnter.append('text')
			    	.attr("text-anchor", "middle")
			        .attr('x', function(d, i){ return (self.eachChartWidth/2)+self.barchartScales(d.get("name"))})
			        .attr('y', self.height+15)
			        .text(function(d){ return d.get('name'); });
			}	
			
			
			 // Update the graph if the data changes.  first line
			var barChartUpdate = d3.transition(barChart);

			 
			 d3.selectAll("#" + self.targetDiv + " .barChart")
			 .transition()
			 .attr("transform", function(d,i){
				  	
				  	return 	"translate(" + self.barchartScales(d.get("name")) + ",0)"
				  	
			  	})

			barChartUpdate.selectAll(".bar")					
					.attr("y", function(d) { return self.scales.y(Math.max(0, d.get(self.dataType))); })
			 	  .attr("height", function(d) { return Math.abs(self.scales.y(d.get(self.dataType)) - self.scales.y(0)); });
			 

			 // and now for legend items
			 var legendUpdate = d3.transition(legend);
			 
			 legendUpdate.select("text")
				.attr('x', function(d, i){ return (self.eachChartWidth/2)+self.barchartScales(d.get("name"))}); 
			  	  
		  	// update the axes,   
		    d3.transition(self.svg).select(".y.axis")
		    	.call(self.yAxis);   
		          
		    d3.transition(self.svg).select(".x.axis")
		        .attr("transform", "translate(0," + self.height + ")")
		        .call(self.xAxis);					
   	
			 
			    d3.selectAll("#" + self.targetDiv + " .bar")
				.attr("title", self.makeTip);	
									
				  

			//make my tooltips work
			$('.bar').tipsy({opacity:.9, gravity:'sw', html:true});
			
	
			
		}
	
		drawChart ();

	}

});
