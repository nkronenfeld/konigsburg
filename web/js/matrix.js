// Matrix visualization of a graph

import * as d3 from "d3";

export function MatrixVis (id) {
	this.id = id;
	this.graph = null;
	this.labels = null;

	// Set the graph visualized by this matrix
	this.setGraph = newGraph => {
		const graphSize = newGraph.nodes.length;
		const newMatrix = [];
		for (var i = 0; i < graphSize; ++i) {
			newMatrix[i] = [];
			for (let j = 0; j < graphSize; ++j) {
				newMatrix[i][j] = 0;
			}
		}
		for (let i = 0; i < newGraph.edges.length; ++i) {
			const edge = newGraph.edges[i];
			newMatrix[edge.source][edge.target] = edge.weight;
		}
		this.graph = newMatrix;
		this.labels = newGraph.nodes.map(node => node.name);
	};

	// Update the visuals for this matrix visualization
	this.updateTag = () => {
		if (false) {
			const columns = this.graph.length 
			//    const width = (100.0 / columns) +"%"; 
			const base = d3.select(`#${id}`); 
			const table = base.append("table") 
			const tr = table.selectAll("tr") 
				  .data(this.graph) 
			tr.exit().remove(); 
			const rows = tr.enter().append("tr"); 
			const td = rows.selectAll("td") 
				  .data(function (d) {return d;}) 
			td.exit().remove(); 
			td.enter().append("td") 
				.text(function (d) { return d; });
		} else {
			const thisMatrix = this;
			const columns = this.graph.length;
			const columnNames = [];
			for (let i = 0; i < columns; ++i) columnNames[i] = i;
			const width = 500;
			const height = 500;
			const gridWidth = width / columns;

			const base = d3.select("#"+this.id);
			const svg = base.append("svg")
				  .attr("width", width + 100)
				  .attr("height", height + 100);
			const row = svg.selectAll(".row")
				  .data(this.graph)
				  .enter().append("g")
				  .attr("transform", (d, i) => `translate(0, ${i * gridWidth})`)
			const cell = row.selectAll(".cell")
				  .data(d => d)
				  .enter().append("rect")
				  .attr("x", (d, i) => i * gridWidth)
				  .attr("width", gridWidth)
				  .attr("height", gridWidth)
				  .style("fill-opacity", d => d)
				  .style("fill", "#0080b0");

			row.append("line")
				.attr("x1", 0)
				.attr("x2", width);
			row.append("text")
				.attr("x", (d, i) => i * gridWidth - height)
				.attr("y", (d, i) => (i + 1.5) * gridWidth)
				.attr("dy", ".32em")
				.attr("text-anchor", "end")
				.attr("font-size", "50%")
				.attr("transform", "rotate(-90)")
				.text((d, i) => thisMatrix.labels ? thisMatrix.labels[i] : i);
			const column = svg.selectAll(".column")
				  .data(this.graph)
				  .enter().append("g");
			column.append("line")
				.attr("y1", 0)
				.attr("y2", gridWidth);

			column.append("text")
				.attr("x", width + 20)
				.attr("y", (d, i) => (i + 0.5) * gridWidth)
				.attr("dy", ".32em")
				.attr("text-anchor", "start")
				.attr("font-size", "50%")
				.text((d, i) => thisMatrix.labels ? thisMatrix.labels[i] : i);
		}
	}
};
