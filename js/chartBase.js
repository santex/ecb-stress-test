//the view that constructs a linechart
ChartBase = Backbone.View.extend({
	data: undefined,
	lines: undefined,
	data: undefined,
	
	//defaults for all the configurable options
	dataType:'value',
	dataURL: 'data.csv',
	margin: {top: 40, right: 160, bottom: 60, left: 30},
	hasLegend: "yes",
	legendNames:"auto",
	hasZoom: "yes",
	hasRecessions: "no",
	lineType: "linear",
	YTickLabel: ["",""],
	yScaleVals: [0,100],
	xScaleTicks: 5,
	makeTip: function (d) {			               
			NumbType = d3.format("n");
			formatDate = d3.time.format("%b %d, '%y")
			var toolTip = '<p class="tip3">' + d.get("name") + '<p class="tip1">' + NumbType(d.get(self.dataType)) + '</p> <p class="tip3">' + formatDate(d.get("date"))+'</p>';
	      	return toolTip;},
	lineColors: [selectednav, blue2, purple2, blue3, purple3, teal2, teal4],  
	autoScale: "yes",
	hasMultiData:"no",
	multiDataLabels:["art","garfunkle"],
	multiDataLabelsDisplay:["Unemployed", "Cumulative Change"],
	sheets:"yes",
	colorUpDown:"no",

	
	initialize: function(opts){
		this.options = opts; 
		// if we are passing in options, use them instead of the defualts.
		if(this.options.dataURL){
			this.dataURL = this.options.dataURL;	
		}
		if(this.options.margin){
			this.margin = this.options.margin;	
		}
		if(this.options.dataType){
			this.dataType = this.options.dataType;	
		}
		if(this.options.hasLegend){
			this.hasLegend = this.options.hasLegend;	
		}
		if(this.options.legendNames){
			this.legendNames = this.options.legendNames;	
		}
		if(this.options.hasZoom){
			this.hasZoom = this.options.hasZoom;	
		}
		if(this.options.hasRecessions){
			this.hasRecessions = this.options.hasRecessions;	
		}
		if(this.options.lineType){
			this.lineType = this.options.lineType;	
		}
		if(this.options.YTickLabel){
			this.YTickLabel = this.options.YTickLabel;	
		}
		if(this.options.yScaleVals){
			this.yScaleVals = this.options.yScaleVals;	
		}
		if(this.options.xScaleTicks){
			this.xScaleTicks = this.options.xScaleTicks;	
		}
		if(this.options.makeTip){
			this.makeTip = this.options.makeTip;	
		}
		if(this.options.lineColors){
			this.lineColors = this.options.lineColors;	
		}
		if(this.options.autoScale){
			this.autoScale = this.options.autoScale;	
		}
		if(this.options.hasMultiData){
			this.hasMultiData = this.options.hasMultiData;	
		}
		if(this.options.multiDataLabels){
			this.multiDataLabels = this.options.multiDataLabels;	
		}
		if(this.options.multiDataLabelsDisplay){
			this.multiDataLabelsDisplay = this.options.multiDataLabelsDisplay;	
		}
		if(this.options.multiDataSpacing){
			this.multiDataSpacing = this.options.multiDataSpacing;	
		}
		if(this.options.sheets){
			this.sheets = this.options.sheets;	
		}
		if(this.options.colorUpDown){
			this.colorUpDown = this.options.colorUpDown;	
		}
		//make a collections forthe data.
		this.data = new Lines();
		var theSheets;
		var self = this;

		if (this.sheets == "yes"){
			 theSheets = "d3.json"			
		}else{
			theSheets = "d3.csv"
		}
		if (this.sheets == "yes"){
			 this.parseDate = d3.time.format("%m/%d/%Y").parse;
		}else{
			 this.parseDate = d3.time.format("%m/%d/%y").parse;
		}
		

		//call your data, bind this and stick it all in the models and collections outlined above.
		eval(theSheets)(this.dataURL, _.bind(function (data){
			
			//if there are multiple types, then map them out
			var getNests = d3.nest()
				.key(function(d) { return d.type; })
				.map(data);
			//figures out names of each type of data.  Use this later to make the labels to click on
			this.nestKeys = d3.keys(getNests)	

			
			//for loop that that re-arranges each type of data by line then puts each distinct type onto the view
			for (var i = 0; i< this.nestKeys.length; i++){
				this[this.nestKeys[i]] = new Lines();
				this.rawValue = new Lines();
				this.CumulativeChange = new Lines();
				this.changePreMonth = new Lines();
				this.percentChange = new Lines();
				//pull the types of data out one at a time
				var dataHolder = getNests[this.nestKeys[i]];
				//determine how many lines they have and get the line names from column header of CSV
				//loop over line data, make each line and populate it with a name and the values which will be DataPoints collections
				
				var keys = d3.keys(dataHolder[0]).filter(function(key) { return (key !== "date" && key !== "type" && key!== "category" && key!== "quarters"); });
				var keyblob = {}
				y0 = 0;
				y0Stack = 0;			
			
				
				if (this.legendNames == "auto"){
					for (j=0; j<keys.length; j++){
						keyblob[keys[j]] = keys[j]
					}	
				}else{
				  	for (j=0; j<keys.length; j++){
						keyblob[keys[j]] = this.legendNames[j]					
					}						
				}
				
				_.each(keys, _.bind(function(key) {
			    	var newLine = new Line({name: keyblob[key], 
			    		values: new DataPoints(dataHolder.map(function(d) {		
			    			var theDate
			    			if (d.date == undefined){
				    			theDate = new Date();
			    			}else{theDate = self.parseDate(d.date) }		   	 		
				   	 		return {name:keyblob[key], date: theDate, category:d.category, value:parseFloat(d[key]), quarters:d.quarters};
			      		}),{parse:true}),

				    	stackValues: new stackDataPoints(dataHolder.map(function(d) {
					   	 		var indexofD = dataHolder.indexOf(d)
					   	 		var indexofKey = keys.indexOf(key)
					   	 		y0 = 0;		    	
					   	 		stackTotal = 0;
					   	 		y0Stack = 0;
					   	 	for (counter=0; counter<keys.length; counter++){
						   	 	stackTotal = stackTotal + parseFloat(d[keys[counter]]);
						   	 	stackPercent = (parseFloat((d[keys[counter]]/stackTotal))*100);
					   	 	}					   	 						   	 	
					   	 	if (indexofKey > 0){	
					   	 		for (counter = indexofKey; counter > 0; counter--){
					   	 				y0 = y0 + parseFloat(d[keys[counter-1]]);
					   	 				y0Stack = y0Stack + (parseFloat((d[keys[counter-1]]/stackTotal))*100)
					   	 		}
					   	 	}
					   	 	var theDate
			    			if (d.date == undefined){
				    			theDate = new Date();
			    			}else{theDate = self.parseDate(d.date) }
					   	 	
					   	 		return {name:keyblob[key], date: theDate, y0Total:y0, y1Total:y0 + parseFloat(d[key]), value:parseFloat(d[key]), stackTotal:stackTotal, y0Percent:y0Stack, y1Percent:y0Stack+stackPercent, quarters:d.quarters};
				      		}),{parse:true}) 
			      					      		
			      		});
	
						totalChange = 0;
						newLine.get("values").each(function(currentItemInLoop){
							  var previousItem = newLine.get("values").at(newLine.get("values").indexOf(currentItemInLoop) - 1);

							  var firstItem = newLine.get("values").at(0);
							  var change;
							  if(previousItem){
								  change = currentItemInLoop.get('value') - previousItem.get('value');
								  totalChange += change;
								  percent = ((currentItemInLoop.get('value') / firstItem.get('value')) - 1)*100;
							  
								  currentItemInLoop.set({changePreMonth: change, CumulativeChange: totalChange, percentChange: percent});
							  }	else {currentItemInLoop.set({changePreMonth: 0, CumulativeChange: 0, percentChange:0})}
						  
							
						})
						
					
					
					//make this a loop to add each type straight to the model, and later to add it to each different type					

					var changeArray = ["rawValue","changePreMonth","CumulativeChange","percentChange"]
					for (index=0; index<changeArray.length; index++){
								
								window[changeArray[index]+"Line"] = new Line({name:keyblob[key], values: new DataPoints(
										dataHolder.map(function(d){
											var theDate
							    			if (d.date == undefined){
								    			theDate = new Date();
							    			}else{theDate = self.parseDate(d.date) }
											
											return {name:keyblob[key], date:theDate, category:d.category, type:d.type, value:parseFloat(d[key]), valueraw:parseFloat(d[key]), quarters:d.quarters};
										}),{parse:true}					
									)}
									);	
					
							CumulativeChange = 0;
							var changePreMonth =  [];
							var percentChange = [];
							var rawValue = [];

							window[changeArray[index]+"Line"].get("values").each(function(currentItemInLoop){
			  					  var previousItem = window[changeArray[index]+"Line"].get("values").at(window[changeArray[index]+"Line"].get("values").indexOf(currentItemInLoop) - 1);
			  					  var firstItem = window[changeArray[index]+"Line"].get("values").at(0);
									  if(previousItem){	  						  
			  						  rawValue = currentItemInLoop.get('valueraw');
			  						  changePreMonth = currentItemInLoop.get('valueraw') - previousItem.get('valueraw');
			  						  CumulativeChange += changePreMonth;
			  						  percentChange = ((currentItemInLoop.get('valueraw') / firstItem.get('valueraw')) - 1)*100;
			  					  
			  						  currentItemInLoop.set({value: eval(changeArray[index])});
			  					  }	else {
			  					   if(changeArray[index] == "rawValue"){return}
			  					  currentItemInLoop.set({value: 0})}	  				  	  					
			  				})
					
			  				this[changeArray[index]].add(eval(changeArray[index]+"Line"))
					}



					dataType = this.dataType;
					//add each line that we've made into the this data lines collection
			    	this[this.nestKeys[i]].add(newLine);
			    	this.data.add(newLine);
			    	
	
				}, this));
			
			}			
			

			
			//then it runs the render function
			this.render();
		}, this));	
		
	},

	render: function() {
		// create a variable called "self" to hold a reference to "this"
		var self = this;
		//if it has multi-data, draw it the first time with the first data series
		if (self.hasMultiData=="yes"){
			self.data= self[self.multiDataLabels[self.multiDataLabels.length-1]];
		}
		//set the width and the height to be the width and height of the div the chart is rendered in
		this.width = this.$el.width() - self.margin.left - self.margin.right;
		this.height = this.$el.height() - self.margin.top - self.margin.bottom;
		//make a label based on the div's ID to use as unique identifiers 
		this.targetDiv = $(self.el).attr("id")
		//figure out if it has a timescale or an ordinal scale based on whether category is defined in the data
		this.hasTimeScale = function () {return self.data.models[0].get('values').models[0].get('category') == undefined}();
		//some aspects of the data useful for figuring out bar placement
		this.dataLength = self.data.models[0].get('values').models.length;
		this.numberOfObjects = self.data.models.length;
		this.widthOfBar = (self.width/(self.dataLength*self.numberOfObjects))-(self.width/(self.dataLength*self.numberOfObjects))*.2;
		
		      		   
		//create an SVG
		self.svg = d3.select(self.el).append("svg")
			.attr("width", self.width + self.margin.left + self.margin.right)
		    .attr("height", self.height +self. margin.top + self.margin.bottom)
		    .append("g")
		    .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");  
		
		
			// tooltip divs
			self.tooltipYes = d3.select(self.el).append("div")
				.attr("class", "tooltipYes")
				.style("opacity", 0);
			self.tooltipNo = d3.select(self.el).append("div")
				.attr("class", "tooltipNo")
				.style("opacity", 0);

			self.tooltipDK = d3.select(self.el).append("div")
				.attr("class", "tooltipDK")
				.style("opacity", 0);
		        
		//make a rectangle so there is something to click on
		self.svg.append("svg:rect")
		    .attr("width", self.width)
		    .attr("height", self.height)
		    .attr("class", "plot");
		
		 //make a clip path for the graph  
		 var clip = self.svg.append("svg:clipPath")
		    .attr("id", "clip" + self.targetDiv)
		    .append("svg:rect")
		    .attr("x", -4)
		    .attr("y", -4)
		    .attr("width", self.width+8)
		    .attr("height", self.height+8);			        

		//go get the scales from the chart type view
	   	this.scales = {
        x: this.getXScale(),
        y: this.getYScale()
		};
	   
	    //put in the recessions, if there are any.
		if (self.hasRecessions == "yes"){
			var recessionDateParse = d3.time.format("%m/%d/%Y").parse;
			var recessionData = [{"recess":[{"start":"5/1/1937","end":"6/1/1938"},{"start":"2/1/1945","end":"10/1/1945"},{"start":"11/1/1948","end":"10/1/1949"},{"start":"7/1/1953","end":"5/1/1954"},{"start":"8/1/1957","end":"4/1/1958"},{"start":"4/1/1960","end":"2/1/1961"},{"start":"12/1/1969","end":"11/1/1970"},{"start":"11/1/1973","end":"3/1/1975"},{"start":"1/1/1980","end":"7/1/1980"},{"start":"7/1/1981","end":"11/1/1982"},{"start":"7/1/1990","end":"3/1/1991"},{"start":"3/1/2001","end":"11/1/2001"},{"start":"12/1/2007","end":"6/1/2009"}]}];	
			var recessions = self.svg.selectAll('.recession')
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

	
		//currently quite sloppy method for line that moves with cursor
		var baseElement = document.getElementById(self.targetDiv);

		// Find your root SVG element
		var svgFind = baseElement.querySelector('svg');
		
		// Create an SVGPoint for future math
		var pt = svgFind.createSVGPoint();
		
		// Get point in global SVG space
		function cursorPoint(evt){
		  pt.x = evt.clientX; pt.y = evt.clientY;
		  return pt.matrixTransform(svgFind.getScreenCTM().inverse());
		}
		
		var cursor = -100;
		//add a line	
		self.svg.append('svg:line')
			.attr('class','cursorline')
			.attr("clip-path", "url(#clip" + self.targetDiv + ")")
			.attr('x1', cursor)
			.attr('x2', cursor)
			.attr('y1',0)
			.attr('y2',self.height);	
		
		//move the line with the mouse	
		var svgmove = svgFind.addEventListener('mousemove',function(evt){
		  var loc = cursorPoint(evt);
			cursor = loc.x;
			//just do it on one line? or all lines?
			//d3.selectAll("#" + self.targetDiv + " .cursorline")
			 d3.selectAll(".cursorline")
				.attr('x1', cursor - self.margin.left)
				.attr('x2', cursor - self.margin.left);	
		},false);

    
		//create and draw the x axis
		self.xAxis = d3.svg.axis()
	    	.scale(self.scales.x)
		    .orient("bottom")
		    .tickPadding(8)
		    .ticks(self.xScaleTicks);
		    
	
		//create and draw the y axis                  
		self.yAxis = d3.svg.axis()
	    	.scale(self.scales.y)
		    .orient("left")
		    .tickSize(0-self.width)
		    .ticks(5)
		    .tickPadding(8)
		    .tickFormat(function(d,i) {
		    if (i == (self.scales.y.ticks(5).length) - 1){return self.YTickLabel[0] + d} return d});
		  			
		//if autoScale ing then setup the auto scale.  hasZoom and multiData automatically get auto-scaling
		if (self.autoScale == "yes" || self.hasZoom == "yes" || self.multiData == "yes"){	
		}else{	
			//otherwise setup the manual ticks.						
			self.yAxis.tickValues(self.yScaleVals)
		}
	
		//draw all the axis
		self.svg.append("svg:g")
		    .attr("class", "x axis");		
	    self.svg.select(".x.axis")
	        .attr("transform", "translate(0," + self.height + ")")
	        .call(self.xAxis);
		self.svg.append("svg:g")
		    .attr("class", "y axis");			
	    self.svg.select(".y.axis")
	    	.call(self.yAxis); 


		var topTick = d3.selectAll("#" + self.targetDiv + " .y.axis .tick:last-of-type")

		topTick.append("rect")
			.style("fill", "#FFFFFF")
			.attr("width", self.YTickLabel[1].length*7)
			.attr("height",10)
			.attr("y",-5)
			
		topTick.append("text")
			.style("text-anchor","start")
			.text(self.YTickLabel[1])
			.attr("transform", function(d){
				if (self.YTickLabel[1].length == 1){
					return "translate(-8,4)"
				}else{
					return "translate(-4,4)"
				}					
			})

	
    // if multi-data, will need labels to click on
    if (self.hasMultiData == "yes"){
				var selecttext = self.svg.append("svg:text")
		            	.attr("text-anchor", "start")
			            .attr("x", 0-self.margin.left)
		    	        .attr("y", 0 - self.margin.top + 12)
		        	    .attr("class", "selectext")
			            .text("SELECT:")
				
				//put in the nav buttons up top
				for (var i = 0; i < self.multiDataLabels.length; i++){
					var navtext = self.svg.append("svg:text")
		            	.attr("text-anchor", "start")
			            .attr("x", (self.multiDataSpacing[i]) - self.margin.left)
		    	        .attr("y", 0 - self.margin.top + 30)
		        	    .attr("class", "nav")
		            	.attr("id", (self.multiDataLabels[i]))
			            .text(self.multiDataLabelsDisplay[i])
			            .classed("selected", function (){
				            if (i==self.multiDataLabels.length-1){return true}
			            })				
				}	

	}
	
	//run the renderChart from the view
	this.renderChart();  
			
	return this;

	}

});


