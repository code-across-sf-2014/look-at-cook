(function() {

// TODO(slightlyoff):
//  - break totals out into their own chart so they don't swamp details
//  - chart total revenue vs. total outlay
//  - rebuild-breakdowns
//  - fix colors!

// Copied and modified from:
//    http://bl.ocks.org/mbostock/3884955

var error = console.error.bind(console);
var log = console.log.bind(console);
var int = function(v) { return parseInt(v, 10); };
var year = function(v) { return Date.parse("01 Jan, "+v+" 00:00:00"); };
var d = function(obj, key, val) {
  if ((!obj) || (!key)) { return val; }
  var v = obj[key];
  if (typeof v == "undefined") {
    return val;
  }
  return v;
};


/*
var BudgetChart = function(args) {
  this.xAttr = d(args, "xAttr", "year");
  this.xAttr = d(args, "yAttr", "value");
  this.color = d3.scale.category10();
  this.margin = { top: d(args, "top", 20),
                  right: d(args, "right", 160),
                  bottom: d(args, "bottom", 30),
                  left: d(args, "left", 80) };
  this.width = d(args, "width", 920) - this.margin.left - this.margin.right;
  this.height = d(args, "height", 400) - this.margin.top - this.margin.bottom;

  this.x = d3.time.scale().range([0, this.width]);
  this.y = d3.scale.linear().range([this.height, 0]);
  this.xAxis = d3.svg.axis().scale(this.x).orient("bottom");
  this.yAxis = d3.svg.axis().scale(this.y).orient("left");

  var getXAttr = function(d) { return this.x(d[this.xAttr]); };
  var getYAttr = function(d) { return this.y(d[this.yAttr]); };
  this.line = d3.svg.line().interpolate("linear")
    .x(getXAttr.bind(this))
    .y(getYAttr.bind(this));

  this.svg = d3.select("#"+args.id).append("svg")
    .attr("width", this.width + this.margin.left + this.margin.right)
    .attr("height", this.height + this.margin.top + this.margin.bottom)
  .append("g")
    .attr("transform", "translate(" + this.margin.left + ","
                                    + this.margin.top + ")");
};

BudgetChart.prototype = Object.create(null, {
  render: {
    value: function() {

    }
  },
  load: {
    value: function() {

    }
  },

});


var bc = new BudgetChart({ id: "timeline-chart" });
bc.load("data/CAFR_2004_2013_expenditures.csv");
log(bc);
*/


var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

/*
*/

var margin = { top: 20, right: 160, bottom: 30, left: 80 },
    width = 920 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var x = d3.time.scale()
  .range([0, width]);

var y = d3.scale.linear()
  .range([height, 0]);

var color = d3.scale.category10();

var xAxis = d3.svg.axis()
  .scale(x)
  .orient("bottom");

var yAxis = d3.svg.axis()
  .scale(y)
  .orient("left");

var line = d3.svg.line()
  .interpolate("linear")
  .x(function(d) { return x(d.year); })
  .y(function(d) { return y(d.value); });

var svg = d3.select("#timeline-chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", "translate(" + margin.left + ","
                                  + margin.top + ")");

// Grab and graph all expeditures
d3.csv("data/CAFR_2004_2013_expenditures.csv", function(error, data) {
  var lineItemNames = d3.keys(data[0]).filter(
    function(key) { return key !== "Year"; }
  );
  color.domain(lineItemNames);

  var items = color.domain().map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {
          yearName: d["Year"],
          year: year(d["Year"]),
          value: +d[name]
        };
      })
    };
  });

  x.domain(d3.extent(data, function(d) { return year(d.Year); }));

  y.domain([
    d3.min(items, function(c) {
      return d3.min(c.values, function(v) { return v.value; }); }),
    d3.max(items, function(c) {
      return d3.max(c.values, function(v) { return v.value; }); })
  ]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Amount (thousands)");

  var svgItems = svg.selectAll(".item")
      .data(items)
    .enter().append("g")
      .attr("class", "item");

  svgItems.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return color(d.name); })
      .on("mouseover", function (d) {
          d3.select(this).style("stroke-width","3px");
      })
      .on("mouseout", function(d) {
          d3.select(this).style("stroke-width","");
      })
      .transition()
      .duration(400)
      .attrTween('d',function (d){
        var interpolate = d3.scale.quantile().domain([0,1])
          .range(d3.range(1, d.values.length+1));
        return function(t){
          return line(d.values.slice(0, interpolate(t)));
        };
      });

  // Tooltips
  svgItems.selectAll("circle")
    .data( function(d) { return(d.values); } )
    .enter()
    .append("circle")
      .attr("class","tooltip-circle")
      .attr("cx",  function(d,i){ return x(d.year) })
      .attr("cy", function(d,i){ return y(d.value) })
      .attr("r", 5)
        .on("mouseover", function(d) {
            div.transition().duration(200).style("opacity", .9);
            div.html(d.yearName + "<br>"  + d.value)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            })
        .on("mouseout", function(d) {
            div.transition()
                .duration(400)
                .style("opacity", 0);
        });
      /*
      .style('opacity', 1e-6)//1e-6
      .attr ("title", maketip);
      */

  // Labels
  svgItems.append("text")
      .datum(function(d) {
        return { name: d.name, value: d.values[d.values.length - 1]}; }
      )
      .attr("transform", function(d) {
        return "translate(" + x(d.value.year) + ","
                            + y(d.value.value) + ")";
      })
      .attr("x", 3)
      .attr("dy", ".35em").text(function(d) { return d.name; });

  /*
  svg.selectAll("dot")
    .data(items)
  .enter().append("circle")
    .selectAll("circle")
    .data(function(d) { return d.values; })
    .enter().append("circle")
        .attr("r", 5)
        .attr("cx", function(d) { return x(d.year); })
        .attr("cy", function(d, i) { return y(d.value); })
        .on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div .html(formatTime(d.date) + "<br/>"  + d.close)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });
  */

  /*
  svg.selectAll("dot")
      .data(items)
    .enter().append("circle")
        .attr("r", 5)
        .attr("cx", function(d, i) {
          return x(d.values[i].year);
        })
        .attr("cy", function(d, i) {
          return y(d.values[i].value);
        })
        .on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div .html(formatTime(d.date) + "<br/>"  + d.close)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });
    */
});

/*
*/


})();
