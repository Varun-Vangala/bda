d3.svg("map.svg").then(function(xml) {
    var color2 = ['#85e6c9', '#ffffff', '#fcba03', '#ffffff'];
    var mapSvg = d3.select(xml.documentElement);


    d3.select("#svg-container").node().appendChild(xml.documentElement);
    d3.select("#svg-container").select("#svgmap").attr("height", 500).attr("width", 700);

    var mapRoot = d3.select("#svg-container").select("#svgmap").select("g.testmask").select("#viewport")
        .select("#scaleSVG").select("#svgelements")
        .select("#svgpolygroup");

    var tip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var scatter = d3.select('#scatter').append("svg")
            // .style("top", intro_h + toggle_h*3 + plot_h + panel_margin.top + 15 + 35 + 'px')
            .attr('id', 'scatter')
            .attr('width', 350)
            .attr('height', 300)
            .append("g")
            .attr("transform", "translate(50,-50)")

    d3.dsv("," , "dummy_allocations.csv", function(d){
            d.sec = +d.section.slice(0,3)
            d.traffic = +d.traffic
            return d
        }).then(function(data) {
            console.log(data)
            mapRoot.selectAll("polygon").each(function(){
                section = d3.select(this).attr("data-sectionid");
                rows = data.filter(function(d){return d.sec == section});
                if(rows.length > 0){
                    d3.select(this).attr("fill", "#ba0c2f");
                } else {
                    d3.select(this).attr("fill", "lightgrey")
                }
            })

            /////////// scatter plot ////////////
        var text_font = 'Muli';
        w= 200;
        plot_h = 200;
        text_h = 60;
        var x_POS = d3.scaleLinear()
            .domain([0,11])
            .range([0,w]);
        console.log(x_POS.domain())
        var y_traffic = d3.scaleLinear()
            .domain([0,d3.max(data, function(d){return d.traffic})])
            .range([plot_h, text_h]);

        // ADD AXIS
        scatter.append("g")
            .attr("transform", "translate(0," + plot_h + ")")
            .call(d3.axisBottom(x_POS).tickValues([0, 1,2,3,4,5,6,7,8,9,10,11]))
            .style("color", "black");

        scatter.append("g")
            .call(d3.axisLeft(y_traffic).tickValues([1000000]).tickFormat(d=> d/1000000+"M"))
            .style("color", "black");

        scatter.append("g")
            .attr('id', 'x_axis_label')
            .append('text')
            .attr("transform", "translate(" + w/2 + " ," + (plot_h + 35) + ")")
            .text("# Points of sale")
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .style('font-family', text_font)
            .attr('font-size', '12px');

        scatter.append("g")
            .attr('id', 'y_axis_label')
            .append('text')
            .attr("transform", "rotate(-90)")
            .attr("x", -plot_h/2 - 25)
            .attr("y", -25)
            .text("Traffic score")
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .style('font-family', text_font)
            .attr('font-size', '12px');

        // ADD DOTS
        scatter.append("g")
            .selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", function(d) {return x_POS(d.POS); })
            .attr("y", function(d) {return y_traffic(d.traffic); })
            .attr("height", 1.5)
            .attr("width", 1.5)
            .style("fill", "black");


        mapRoot.selectAll("polygon")
                .on("mouseover", function(d) {
                    section = d3.select(this).attr("data-sectionid")
                    rows = data.filter(function(dd){return dd.sec == section})
                    text = ""
                    if(rows.length > 0){
                        text = text.concat(rows[0].section + "<br>" + "Traffic Percentile: "+  Math.round(rows[0].tperc) + "% <br> <br>")
                        for (var i = 0; i <= rows.length - 1; i++) {
                            if (i > 0){
                                text = text.concat("<br>")
                            }
                            t = "Original: " + rows[i].old + " <br> " + "New: " + rows[i].new + " <br>"
                            text = text.concat(t)
                        }
                    }
                    if(rows.length > 0){
                        tip.transition()
                            .duration(200)
                            .style("opacity", .9);
                        tip.html(text)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");

                        traff = rows[0].traffic
                        scatter.append("text")
                            .attr("id", "highlight")
                            .attr("fill", "black")
                            .attr("font-size", 12)
                            .attr("transform", "translate(" + 0 + ","+ 250 +")")
                            .style("text-anchor", "left")
                            .attr('font-family', text_font)
                            .text("This section has a traffic score of " + Math.round(traff));
                        scatter.append("text")
                            .attr("id", "highlight")
                            .attr("fill", "black")
                            .attr("font-size", 12)
                            .attr("transform", "translate(" + 0 + ","+ 265 +")")
                            .style("text-anchor", "left")
                            .attr('font-family', text_font)
                            .text("This is greater than " + Math.round(rows[0].tperc) + "% of other sections with concessions");

                        for (var i = 0; i <= rows.length - 1; i++) {
                            p = rows[i].POS
                            if (i >= 0){
                                scatter
                                    .append("circle")
                                    .attr('id', 'highlight')
                                    .attr("cx", x_POS(p))
                                    .attr("cy", y_traffic(traff))
                                    .attr("r", 3)
                                    .attr("fill", color2[1])
                                    .attr('stroke', color2[0])
                                    .attr('stroke-width', 2)
                                scatter.append("text")
                                    .attr("id", "highlight")
                                    .attr("fill", "black")
                                    .attr("font-size", 12)
                                    .attr("transform", "translate(" + 0 + ","+ (280+(15*i)) +")")
                                    .style("text-anchor", "left")
                                    .attr('font-family', text_font)
                                    .text("Changing section " + rows[i].section + " results in a " + (Math.round(100*(rows[i].nrev- rows[i].orev)/rows[i].orev)) + "% revenue change");
                            }

                        }

                    }
            })
                .on("mouseout", function(d) {
                    tip.transition()
                        .duration(0)
                        .style("opacity", 0);
                    scatter.selectAll("#highlight").remove()
                });
        }
        )
});
