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
        return { year: year(d["Year"]), value: +d[name] };
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

  var items = svg.selectAll(".item")
      .data(items)
    .enter().append("g")
      .attr("class", "item");

  items.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return color(d.name); });

  items.append("text")
      .datum(function(d) {
        return { name: d.name, value: d.values[d.values.length - 1]}; }
      )
      .attr("transform", function(d) {
        return "translate(" + x(d.value.year) + ","
                            + y(d.value.value) + ")";
      })
      .attr("x", 3)
      .attr("dy", ".35em").text(function(d) { return d.name; });
});


})();
