var Chart, chart;

function throttle(callback, limit) {
    var wait = false;
    return function() {
        if (!wait) {
            callback.call();
            wait = true;
            setTimeout(function() {
                wait = false;
            }, limit);
        }
    };
}

Chart = function() {
    var resize, self;

    //layout variables
    var margin = { top: 30, right: 0, bottom: 40, left: 50 };
    var height = 500;
    var width = 1050;
    var innerWidth = width - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;
    var determinedHeight = margin.top + margin.bottom + 100;
    var tickThreshold = margin.top + margin.bottom + 500;
    var determinedWidth = margin.left + margin.right + 100;
    var fontSize = 15;

    //ticks
    var maxTicks = 10;
    var minTicks = 5;
    var ticks = maxTicks;
    var throttleLength = 100;

    //data stores
    var data = [];
    var xVal = "label";
    var yVal = "% of comments";

    //styling variables
    var duration = 250;
    var delay = 250;

    //parent DOM variables
    var dom = null;
    var svg = null;
    var barGroup = null;
    var bars = null;

    //axis related variables
    var x = null;
    var y = null;
    var xAxis = null;
    var yAxis = null;
    var xAxisGroup = null;
    var yAxisGroup = null;

    resize = function() {
        self.resize();
    };
    window.addEventListener("resize", throttle(resize, throttleLength));
    return (self = {
        create: function(el) {
            var bars = null;

            //layout definition
            dom = el;
            svg = dom.append("svg");
            barGroup = svg.append("g").attr("class", "bar--group");

            //define height and width
            self.getsize();

            //define svg container attributes
            svg
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", "0 0 " + width + " " + height)
                .attr("preserveAspectRatio", "xMidYMid");

            //scales declaration with range
            x = d3
                .scaleBand()
                .rangeRound([margin.left, innerWidth])
                .padding(0.1);
            y = d3.scaleLinear().rangeRound([innerHeight, margin.top]);
            //scales domain
            x.domain(
                data.map(function(d) {
                    return d[xVal];
                })
            );
            y.domain([
                0,
                d3.max(data, function(d) {
                    return d[yVal];
                })
            ]);
            //create axes
            xAxis = d3.axisBottom().scale(x);
            yAxis = d3.axisLeft().scale(y);
            //draw axes
            xAxisGroup = svg
                .append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + innerHeight + ")")
                .call(xAxis);
            yAxisGroup = svg
                .append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + margin.left + ",0)")
                .call(yAxis);
            //draw yaxis label
            yAxisGroup
                .append("text")
                .attr("class", "label")
                .attr("transform", "rotate(-90)")
                .attr("y", 0)
                .attr("x", 0 - margin.top)
                .attr("dy", "1em")
                .style("text-anchor", "end")
                .text(yVal);
            xAxisGroup
                .append("text")
                .attr("class", "label")
                .attr("y", 20)
                .attr("x", 950 - margin.top)
                .attr("dy", "1em")
                .style("text-anchor", "end")
                .text("sentiment");

            //bars container
            bars = barGroup.selectAll(".bar");
            //bars
            bars
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", function(d) {
                    return x(d[xVal]);
                })
                .attr("y", function(d) {
                    return y(d[yVal]);
                })
                .attr("width", x.bandwidth())
                .attr("height", function(d) {
                    return innerHeight - y(d[yVal]);
                });

            return self;
        },
        getsize: function() {
            //method for updating container dimensions based on DOM
            h = dom.node().getBoundingClientRect().height;
            w = dom.node().getBoundingClientRect().width;
            height = h > determinedHeight ? h : determinedHeight;
            ticks = h > tickThreshold ? maxTicks : minTicks;
            width = w > determinedWidth ? w : determinedWidth;
            margin.bottom = height * 0.1;
            margin.top = height * 0.05;
            margin.left = height * 0.1;
            innerWidth = width - margin.left - margin.right;
            innerHeight = height - margin.top - margin.bottom;
            console.log(data.length);
        },
        redraw: function() {
            //redefine scales and viewbox, then draw everything accordingly
            bars = barGroup.selectAll(".bar").data(data);

            svg.attr("viewBox", "0 0 " + width + " " + height);

            //Update Axes
            x.rangeRound([margin.left, innerWidth]).domain(
                data.map(function(d) {
                    return d[xVal];
                })
            );
            y.rangeRound([innerHeight, margin.top]).domain([
                0,
                d3.max(data, function(d) {
                    return d[yVal];
                })
            ]);

            xAxis.scale(x);
            yAxis.scale(y).ticks(ticks);

            yAxisGroup
                .transition()
                .duration(duration)
                .attr("transform", "translate(" + margin.left + ",0)")
                .call(yAxis);
            xAxisGroup
                .transition()
                .duration(duration)
                .attr("transform", "translate(0," + innerHeight + ")")
                .call(xAxis)
                .on("end", self.barsUpdate);
            yAxisGroup.attr("x", 0 - margin.top);

            xAxisGroup.selectAll(".tick text").style("font-size", "10px");

            bars.attr("height", 0);

            return self;
        },
        barsUpdate: function() {
            // EXIT old elements not present in new data.
            bars
                .exit()
                .attr("height", 0)
                .remove();

            // UPDATE old elements present in new data.
            bars
                .attr("height", 0)
                .attr("x", function(d) {
                    return x(d[xVal]);
                })
                .attr("y", innerHeight)
                .attr("width", x.bandwidth())
                .transition()
                .delay(function(d, i) {
                    return throttleLength + i * delay;
                })
                .duration(duration)
                .attr("y", function(d) {
                    return y(d[yVal]);
                })
                .attr("height", function(d) {
                    return innerHeight - y(d[yVal]);
                });

            // ENTER new elements present in new data.
            bars
                .enter()
                .append("rect")
                .attr("x", function(d) {
                    return x(d[xVal]);
                })
                .attr("y", innerHeight)
                .attr("height", 0)
                .transition()
                .delay(function(d, i) {
                    return i * delay;
                })
                .duration(duration)
                .attr("class", "bar")
                .attr("width", x.bandwidth())
                .attr("y", function(d) {
                    return y(d[yVal]);
                })
                .attr("height", function(d) {
                    return innerHeight - y(d[yVal]);
                });
        },
        update: function(d) {
            //update data and redraw
            data = d;

            self.redraw();

            return self;
        },
        resize: function() {
            //update container size and redraw
            self.getsize();
            self.redraw();
        }
    });
};

chart = Chart().create(d3.select(".chart--container"));

chart.update([
    {
        label: "-1.0 -> -0.75",
        "% of comments": 50
    },
    {
        label: "-0.75 -> -0.50",
        "% of comments": 100
    },
    {
        label: "0.50 -> -0.25",
        "% of comments": 20
    },
    {
        label: "-0.25 -> 0",
        "% of comments": 50
    },
    {
        label: "0 -> 0.25",
        "% of comments": 50
    },
    {
        label: "0.25 -> 0.50",
        "% of comments": 50
    },
    {
        label: "0.50 -> 0.75",
        "% of comments": 50
    },
    {
        label: "0.75 -> 1.0",
        "% of comments": 50
    },
]);