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
});


var bc = new BudgetChart({ id: "timeline-chart" });
bc.load("data/CAFR_2004_2013_expenditures.csv");
log(bc);
