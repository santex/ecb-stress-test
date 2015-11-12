//a model for each line of data
//basic dataType.  this will get replaced w/ the dataType put on the view, so that the comparator sorts by the right data on each collection
var dataType = "value";

Line = Backbone.Model.extend({	
	defaults: {
		name: undefined,
		values: undefined, 
	},	
});
//a collection of those lines
Lines = Backbone.Collection.extend({
	comparator: function (item){return -item.get("values").models[item.get("values").models.length-1].get(dataType)},
	model: Line,

});
//each data point with name, date and value.  The parser makes the bad BLS dates nice.
DataPoint = Backbone.Model.extend({
	defaults:{
		name: undefined,
		date: undefined,
		value: undefined,
		valueraw:undefined,
		quarters:undefined
	},
	parse: function(point){
		//figure out a better way to do this.  basically if you have a bar chart and you are using categories for scale instead of date, don't want the date function below to fail
		return {
			date: point.date,
			value: point.value,
			valueraw: point.valueraw,	
			name:point.name,
			category:point.category,
			quarters:point.quarters
		}
	}
});
//the collection of datapoint which will sort by date.
DataPoints = Backbone.Collection.extend({
	comparator: function(item) {
      //if there is no category field, then sort based on date, else sort on category
      if (item.get("category") ===undefined) {return item.get("date")}else{return item.get("category");}
          },
	model: DataPoint,
	parse: function(data){
		return data;
	}	
});


stackDataPoint = Backbone.Model.extend({
	defaults:{
		name: undefined,
		date: undefined,
		y0Total: undefined,
		y1Total:undefined,
		value:undefined,
		stackTotal:undefined,
		y0Percent:undefined,
		y1Percent:undefined,
		quarters:undefined
	},
	parse: function(point){

		//figure out a better way to do this.  basically if you have a bar chart and you are using categories for scale instead of date, don't want the date function below to fail
		return {
			date: point.date,
			y0Total: point.y0Total,
			y1Total: point.y1Total,	
			name:point.name,
			category:point.category,
			value:point.value,
			stackTotal:point.stackTotal,
			stackPercent:point.stackPercent,
			y0Percent:point.y0Percent,
			y1Percent:point.y1Percent,
			quarters:point.quarters
		}
	}
});
//the collection of datapoint which will sort by date.
stackDataPoints = Backbone.Collection.extend({
	comparator: function(item) {
      //if there is no category field, then sort based on date, else sort on category
      if (item.get("category") ===undefined) {return item.get("date")}else{return item.get("category");}
          },
	model: stackDataPoint,
	parse: function(data){
		return data;
	}	
});