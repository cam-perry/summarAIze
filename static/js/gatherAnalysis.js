$.ajax({
  url: '/api/analyze',
  method: 'GET',
  success: function(response) {
    console.log(response.results);
    createChart(response.results.sentimentsResults);
    displayEntities(response.results.entitiesResults);
    displayComments(response.results.commentResults);
    $('#loading-spinner').css('display', 'none');
  },
  error: function(error) {
    console.log(error);
  }
})

// display comments
function displayComments(commentSummary) {
  revCommentSummary = commentSummary.reverse();
  let insert = '';
  insert += '<ul class="list-group">'
  for (let i = 0; i < 5; i++) {
    let summary = revCommentSummary[i];
    let comments = summary[0];
    let randComment = comments[Math.floor(Math.random() * comments.length)]
    let frequency = summary[2];

    const ending_chars = summary[1].slice(summary[1].length - 2);
    const is_negative = ending_chars[0] === '-';
    const rating = ending_chars[1];
    const li_colouring = rating === '0' ? 'list-group-item-secondary' : (is_negative ? 'list-group-item-danger' : 'list-group-item-success');

    const entity = is_negative ? summary[1].slice(0, summary[1].length - 2) : summary[1].slice(0, summary[1].length - 1);

    insert += '<li class="list-group-item ' + li_colouring + '" data-toggle="collapse" data-target="#comment'+i.toString()+'">'
    insert += '<div class="comment-summary-item">'
    // the entity identified
    insert += '<p class="entity-name">' + entity[0].toUpperCase() + entity.slice(1).toLowerCase() + '</p>'
    //comment here
    insert += '<p class="repr-comment">' + randComment + '</p>';
    // count of the mentions
    insert += '<p class="comment-count">' + frequency.toString() + (frequency > 1 ? ' comments' : ' comment') + '</p>';
    // end of the always-shown comment summary
    insert += '</div>';
    insert += '<div id="comment'+i.toString()+'" class="collapse">';
    insert += '<h6 class="similar-comments-header">Similar Comments:</h6>';
    let similarComments = 0;
    for (let i = 0; i < Math.min(5,comments.length); i++){
      if(comments[i] != randComment){
        insert += comments[i] + "<br /><br />";
        similarComments += 1;
      }
    }
    if (similarComments == 0){
      insert += "None"
    }
    insert += '</div></li>'
  }
  insert += '</ul>'
  $('#commentSection').html(insert);
  $('#comments-header').html('Similar Comment Summary');
}

function displayEntities(entities) {
  const sorted_entities = sortEntities(entities);
  let max = sorted_entities.length < 10 ? sorted_entities.length : 10;
  let insert = '';
  for (let i=0; i < max; i++) {
    const li_class = sorted_entities[i].score < 0 ? 'list-group-item-danger' : 'list-group-item-success';
    const {title, count, score} = sorted_entities[i];
      insert += (
        '<button data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" ' +
              'data-title="Sentiment: ' + parseFloat(score).toFixed(2) + '" ' +
              'data-content="0 represents a neutral sentiment."' +
              'class="list-group-item list-group-item-action ' + li_class + '">' +
        '<p><strong>' + title + '</strong></p>' +
        '<p>' + count + (count === 1 ? ' mention' : ' mentions') + '</p>' +
        '</button>'
      )
  }
  $('#top-entities').html(insert);
  $('#entities-header').html('Most Discussed Subjects');

  // initialize the popovers
  $(function () {
    $('[data-toggle="popover"]').popover()
  })
}

function sortEntities(entities) {
  // bubbles sort the entities list from most to least counted
  let entities_array = [];
  Object.keys(entities).forEach( function(entity){
    entities_array.push({
      title: entity,
      count: entities[entity].count,
      score: entities[entity].score
    });
  });
  let swapped;
  do {
    swapped = false;
    for (let i=0; i < entities_array.length-1; i++) {
      if (entities_array[i].count < entities_array[i+1].count) {
        var temp = entities_array[i];
        entities_array[i] = entities_array[i+1];
        entities_array[i+1] = temp;
        swapped = true;
      }
    }
  } while (swapped);
  return entities_array;
}

function createChart(labels) {
  chart = Chart().create(d3.select(".chart--container"));
  chart.update([
      {
          label: "-1.0",
          "% of comments": labels['-1.0to-0.75']
      },
      {
          label: "-0.75",
          "% of comments": labels['-0.75to-0.50']
      },
      {
          label: "-0.50",
          "% of comments": labels['-0.50to-0.25']
      },
      {
          label: "-0.25",
          "% of comments": labels['-0.25to0.00']
      },
      {
          label: "0.00",
          "% of comments": labels['0.00to0.25']
      },
      {
          label: "0.25",
          "% of comments": labels['0.25to0.50']
      },
      {
          label: "0.50",
          "% of comments": labels['0.50to0.75']
      },
      {
          label: "0.75",
          "% of comments": labels['0.75to1.00']
      },
  ]);
  $('#sentiment-header').html('Overall Sentiment');
}


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

// used to generate a bar chart
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
                .attr("x", "93%")
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
