// Function to compute density
function kernelDensityEstimator(kernel, X) {
  return function(V) {
    return X.map(function(x) {
      return [x, d3.mean(V, function(v) { return kernel(x - v); })];
    });
  };
}
function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  };
}

function loadFile() {
    var input, file, fr;
    var input, file, fr;
    if (typeof window.FileReader !== 'function') {
      alert("The file API isn't supported on this browser yet.");
      return;
    }
    input = document.getElementById('fileinput');
    if (!input) {
      alert("Um, couldn't find the fileinput element.");
    }
    else if (!input.files) {
      alert("This browser doesn't seem to support the `files` property of file inputs.");
    }
    else if (!input.files[0]) {
      alert("Please select a file before clicking 'Load'");
    }
    else {
      file = input.files[0];
      fr = new FileReader();
      fr.onload = receivedText;
      fr.readAsText(file);
    }
    function receivedText(e) {
        let lines = e.target.result;
        let parsed_json = JSON.parse(lines);
        let arr = sortArray(parsed_json.stats_array)
        let raw_arr = parsed_json.stats_array
        drawAbsoluteRiskCurve(arr) 
        plotDensity(raw_arr)
    }
}

/*
 *  Cleans up and minimizes data from 50000 points to 100 for percentile calculations
*/
function sortArray(data){
    var clean_arr = []
    var percentile_arr = []
    for(var i=0; i<data.length; i++){
        //console.log(data[i].percentile)
        if(!percentile_arr.includes(data[i].percentile)){
            clean_arr.push(data[i]) 
            percentile_arr.push(data[i].percentile) 
        }
    }
    clean_arr.sort(function(a,b) {
        return a.percentile - b.percentile
    });
    console.log(clean_arr.length)
    return clean_arr;
}
/*
function plotDensity(data) {
    var svgWidth = 600, svgHeight = 400;
    var margin = {top: 30, right:50, bottom:70, left: 70};
    var width = svgWidth -  margin.left - margin.right;
    var height = svgHeight - margin.top - margin.bottom;
     
    var svg = d3.select(".density")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    
    var g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    
    var x = d3.scaleLinear()
        .rangeRound([0, width])
    var y = d3.scaleLinear()
        .rangeRound([height, 0])
    
 
    // Compute kernel density estimation
    var kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(60))
    var control =  kde(data
        .filter( function(d){return d.x == 0} )
        .map(function(d){  return d.y; }) )
    var cases =  kde(data
        .filter( function(d){return d.x == 1} )
        .map(function(d){  return d.y; }) )


    x.domain(d3.extent(control, function(d) { return d[0]; }))
    y.domain([0,0.12] )//d3.extent(control, function(d) { return d[1]; }))
    
    // x axis 
    g.append('g')
        .attr('class', 'axis axis-x')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickPadding(8))
 
    // y axis 
    g.append('g')
        .attr('class', 'axis axis-y')
        .call(d3.axisLeft(y).tickPadding(8))
    
    // Plot the area
    g.append("path")
        .attr("class", "mypath")
        .datum(control)
        .attr("fill", "blue")
        .attr("opacity", ".3")
        .attr("stroke", "blue")
        .attr("stroke-width", 3)
        .attr("stroke-linejoin", "round")
        .attr("d",  d3.line()
            .curve(d3.curveBasis)
            .x(function(d) { return x(d[0]); })
            .y(function(d) { return y(d[1]); })
        );
    // Plot the area
    g.append("path")
        .attr("class", "mypath")
        .datum(cases)
        .attr("fill", "#fa1100")
        .attr("opacity", ".3")
        .attr("stroke", "#fa1100")
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round")
        .attr("d",  d3.line()
            .curve(d3.curveBasis)
            .x(function(d) { return x(d[0]); })
            .y(function(d) { return y(d[1]); })
        );
}
*/
/*
     * Creates absolute risk curve with array of points supplied
     * [
     *  {
     *    percentile: percentile (int),
     *    y: PRS score (float)
     *  }
     * ]
     *
*/

function drawAbsoluteRiskCurve(data) {
    
    var svgWidth = 600, svgHeight = 400;
    var margin = {top: 30, right:50, bottom:70, left: 70};
    var width = svgWidth -  margin.left - margin.right;
    var height = svgHeight - margin.top - margin.bottom;
    var bisectPercentile = d3.bisector(function(d) { return d.percentile; }).left 

    var svg = d3.select('.absolute-risk') 
        .attr('width', svgWidth)
        .attr('height', svgHeight)

    var g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    
    var x = d3.scaleLinear()
        .rangeRound([0, width])

    var y = d3.scaleLinear()
        .rangeRound([height, 0])

    var line = d3.line()
        .curve(d3.curveBasis)
        .x(function(d) { return x(d.percentile)})
        .y(function(d) { return y(d.y)})
   
    x.domain(d3.extent(data, function(d) { return d.percentile; }))
    y.domain([0,1])//d3.extent(data, function(d) { return d.y ; }))

    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "end")
        .text("Risk"); 

    //text label for x axis
    svg.append("text")
        .attr("y", height + margin.top + (margin.bottom*0.5))
        .attr("x", width/2)
        .attr("dy", "1em")
        .style("text-anchor", "beginning")
        .text("Percentile"); 
    
    // x axis
    g.append('g')
        .attr('class', 'axis axis-x')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x).tickPadding(8).ticks(5))
        //.select('.domain')
        //.remove()
    
    // y axis 
    g.append('g')
        .attr('class', 'axis axis-y')
        .call(d3.axisLeft(y).tickPadding(8).ticks(5))
    
    // line
    g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-width', 1.5)
        .attr('d', line)
        .on('mouseover', function(obj) {
             d3.select(this).attr('stroke', '#00688B');
        }).on('mouseout', function(obj) {
             d3.select(this).attr('stroke', '#87CEEB');
        });
    
    
    // PATIENT PERCENTILE LINE AND POINT  
    var item = data[bisectPercentile(data, 50)];
    g.append('line')
        .attr('x1', x(50))
        .attr('x2', x(50))
        .attr('y1', y(item.y)) 
        .attr("y2", height)
        .attr('class', 'hover-line')
        //.attr('r', 3)
        //.style("fill", 'orange') 
    g.append('circle')
        .attr('r', 3)
        .attr('cx', x(50) )
        .attr('cy', y(item.y)) 
        .style('fill', 'orange')

    
    var focus = g.append('g')
		.attr('class','focus')
		.style('display', 'none') 

	focus.append('line')
		.attr('class', 'x-hover-line hover-line')
		.attr('y1', 0)
		.attr('y2', height);
    
    focus.append('line')
		.attr('class', 'y-hover-line hover-line')
		.attr('x1', 0)
		.attr('x2', 0)

    focus.append('circle')
        .attr('r', 2)

    focus.append("rect")
        .attr("class", "tooltip")
        .attr("width", '4.5rem')
        .attr("height", '3.2rem')
        .attr("x", 10)
        .attr("y", -55)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr('fill', 'rgb(230,230,230)')
        .attr('stroke', '#000');

    focus.append('text')
        .attr('class', 'text1 info-text')
        .attr('x', 15)
        .attr('y', -35)
        .attr('font-size', '14px')//'0.82rem')

    focus.append('text')
        .attr('class', 'text2 info-text')
        .attr('x', 15)
        .attr('y', -15)
        .attr('font-size', '14px')//'0.82rem')

    svg.append('rect')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', function(){focus.style('display', null);})
        .on('mouseout', function(){focus.style('display', 'none');})
        .on('mousemove', mousemove)

    function mousemove(){
        var x0 = x.invert(d3.mouse(this)[0]),
          i = bisectPercentile(data, x0, 1),
          d0 = data[i - 1],
          d1 = data[i],
          d = x0 - d0.percentile == d1.percentile - x0 ? d1 : d0;
      focus.attr("transform", "translate(" + x(d.percentile) + "," + y(d.y) + ")");
      focus.select(".text1").html(function() { return '%ile: ' + d.percentile; });
      focus.select(".text2").html(function() { return 'PRS: ' + d.y.toFixed(2); });
      focus.select(".x-hover-line").attr("y2", height - y(d.y));
      focus.select(".y-hover-line").attr("x2", - (x(d.percentile)));//-(margin.left + x(d.percentile) - width));
    }
        
}
