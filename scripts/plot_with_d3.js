(function() {
"use strict";

// TODO(slightlyoff):
//  - break totals out into their own chart so they don't swamp details
//  - chart total revenue vs. total outlay
//  - rebuild-breakdowns
//  - fix colors!

// Copied and modified from:
//    http://bl.ocks.org/mbostock/3884955

var error = console.error.bind(console);
var log = console.log.bind(console);
var dir = console.dir.bind(console);
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

var chartMap = {};

var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var graphLines = function(id, data, opts) {
  var margin = { top:    d(opts, "top",    20),
                 right:  d(opts, "right", 200),
                 bottom: d(opts, "bottom", 30),
                 left:   d(opts, "left",   80) };
  var width = d(opts, "width", 920) - margin.left - margin.right;
  var height = d(opts, "height", 400) - margin.top - margin.bottom;

  var x = d3.time.scale().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

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
    /*
    0,
    */
    d3.min(items, function(c) {
      return d3.min(c.values, function(v) { return v.value; }); }),
    d3.max(items, function(c) {
      return d3.max(c.values, function(v) { return v.value; }); })
  ]);

  var svg;

  if (chartMap[id]) {
    svg = chartMap[id];
    svg.selectAll(".item").remove();
    svg.selectAll("g").remove()
  } else {
    svg = d3.select(id).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + ","
                                      + margin.top + ")");
    chartMap[id] = svg;

  }

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text(d(opts, "label", "Amount (thousands)"));

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
};

var graphTotals = function(id, data, opts) {
  var titles = ["Year", "Total expenditures"];
  var data = data.map(function(o) {
    var r = {};
    titles.forEach(function(t) { r[t] = o[t]; });
    return r;
  });
  graphLines(id, data, opts);
};

var graphDetails = function(id, data, opts) {
  var data = data.map(function(o) {
    var r = {};
    Object.keys(o).forEach(function(t) {
      if (t != "Total expenditures") {
        r[t] = o[t];
      }
    });
    return r;
  });
  graphLines(id, data, opts);
};

var graphPopulation = graphLines;

var deflator_data = null;
var cafr_data = null;
var population_data = null;

var percapita = document.querySelector("#percapita");
var inflationadjusted = document.querySelector("#inflationadjusted");
var update = function() {
  var label = "Amount (thousands)";
  var truncated_cafr_data = cafr_data.slice(0);
  var truncated_deflator_data =
      deflator_data.slice(deflator_data.length - cafr_data.length);

  var truncated_population_data =
      population_data.slice(population_data.length - cafr_data.length);

  if (percapita.checked) {
    if (!population_data) { return; }
    label = "Per resident";
    truncated_cafr_data = truncated_cafr_data.map(function(i, idx, a) {
      var residents = truncated_population_data[idx]["Residents"];
      var r = {};
      Object.keys(i).forEach(function(key) {
        if (key == "Year") {
          r[key] = i[key];
        } else {
          r[key] = Number(i[key]/residents).toFixed(3) * 1000;
        }
      });
      return r;
    });
  }

  if (inflationadjusted.checked) {
    if (!deflator_data) { return; }
    label = label + ", 2013 dollars";
    truncated_cafr_data = truncated_cafr_data.map(function(i, idx, a) {
      var deflator = parseFloat(truncated_deflator_data[idx]["Deflator"]);
      var r = {};
      Object.keys(i).forEach(function(key) {
        if (key == "Year") {
          r[key] = i[key];
        } else {
          r[key] = Number((i[key]/deflator) * 100).toFixed(3);
        }
      });
      return r;
    });
  }

  graphTotals("#totals-chart", truncated_cafr_data,
      { width: 920, height: 170, label: label });
  graphDetails("#details-chart", truncated_cafr_data,
      { width: 920, height: 500, label: label });
  graphPopulation("#population-chart", truncated_population_data,
      { width: 920, height: 170, label: "" });
};

percapita.addEventListener("change", update);
inflationadjusted.addEventListener("change", update);


// Grab the data, parse it, and graph it
d3.csv("data/CAFR_2004_2013_expenditures.csv", function(error, data) {
  cafr_data = data;
  d3.csv("data/Population_1989_2013.csv", function(error, data) {
    population_data = data;
    d3.csv("data/GDP_Deflator_1989_2013.csv", function(error, data) {
      deflator_data = data;
      update();
    });
  });
});


})();
