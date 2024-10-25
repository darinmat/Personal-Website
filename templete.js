/// Load the Iris dataset
d3.csv("iris.csv").then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.PetalLength = +d.PetalLength;
        d.PetalWidth = +d.PetalWidth;
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 50, right: 30, bottom: 50, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container for the scatter plot
    const scatterSvg = d3.select("#scatterplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 100)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up scales for x and y axes
    const xScaleScatter = d3.scaleLinear()
        .domain([d3.min(data, d => d.PetalWidth), d3.max(data, d => d.PetalWidth)])
        .range([0, width]);

    const yScaleScatter = d3.scaleLinear()
        .domain([d3.min(data, d => d.PetalLength), d3.max(data, d => d.PetalLength)])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.Species))
        .range(d3.schemeCategory10);

    // Add scales
    scatterSvg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScaleScatter));

    scatterSvg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScaleScatter));

    // Add circles for each data point
    scatterSvg.selectAll(".circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScaleScatter(d.PetalWidth))
        .attr("cy", d => yScaleScatter(d.PetalLength))
        .attr("r", 5)
        .attr("fill", d => colorScale(d.Species));

    // Add x-axis label
    scatterSvg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + 40)
        .text("Petal Width");

    // Add y-axis label
    scatterSvg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", -40)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("Petal Length");

    // Add legend
    const legend = scatterSvg.selectAll(".legend")
    .data(colorScale.domain())
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => "translate(0," + (i * 20 - 50) + ")");

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", colorScale);

    legend.append("text")
        .attr("x", width)  // Position text to the right of the rectangle
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")  // Align text from the left
        .text(d => d);

    // Part 2: Side-by-Side Box Plot
    // Create the SVG container for the box plot
    const boxSvg = d3.select("#boxplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up scales for x and y axes
    const xScaleBox = d3.scaleBand()
        .domain(data.map(d => d.Species))
        .range([0, width])
        .padding(0.1);

    const yScaleBox = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.PetalLength)])
        .nice()
        .range([height, 0]);

    // Add scales
    boxSvg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScaleBox));

    boxSvg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScaleBox));

    // Add x-axis and y-axis labels
    boxSvg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + 40)
        .text("Species");

    boxSvg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", -40)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("Petal Length");

    // Rollup function to calculate quartiles
    const rollupFunction = function(groupData) {
        const values = groupData.map(d => d.PetalLength).sort(d3.ascending);
        const q1 = d3.quantile(values, 0.25);
        const median = d3.median(values);
        const q3 = d3.quantile(values, 0.75);
        return { q1, median, q3 };
    };

    // Calculate quartiles by species
    // This code groups each speciate together by quartile for calculation of further summary statistics
    const quartilesBySpecies = d3.rollup(data, rollupFunction, d => d.Species);

    // Draw the box plots
    // This code calculates the width to be drawn of each box plot based on the quartile data
    quartilesBySpecies.forEach((quartiles, species) => {
        const x = xScaleBox(species);
        const boxWidth = xScaleBox.bandwidth();
        const iqr = quartiles.q3 - quartiles.q1;

        // Draw vertical line
        boxSvg.append("line")
            .attr("x1", x + boxWidth / 2)
            .attr("x2", x + boxWidth / 2)
            .attr("y1", yScaleBox(quartiles.q1 - 1.5 * iqr))
            .attr("y2", yScaleBox(quartiles.q3 + 1.5 * iqr))
            .attr("stroke", "black");

        // Draw box
        boxSvg.append("rect")
            .attr("x", x)
            .attr("y", yScaleBox(quartiles.q3))
            .attr("width", boxWidth)
            .attr("height", yScaleBox(quartiles.q1) - yScaleBox(quartiles.q3))
            .attr("fill", colorScale(species))
            .attr("stroke", "black");

        // Draw median line
        boxSvg.append("line")
            .attr("x1", x)
            .attr("x2", x + boxWidth)
            .attr("y1", yScaleBox(quartiles.median))
            .attr("y2", yScaleBox(quartiles.median))
            .attr("stroke", "black");
    });
});
   