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

	this.setupTag = () => {
		this.margins = {left: 100, right: 0, top: 100, bottom: 0};
		this.width = 500;
		this.height = 500;
		const svg = d3.select("svg#"+this.id)
			  .attr("width", this.width + this.margins.left + this.margins.right)
			  .attr("height", this.height + this.margins.top + this.margins.bottom);
		this.g = svg.append("g")
		this.g.append("rect")
			.attr("fill", "#f0f8fc")
			.attr("width", this.width)
			.attr("height", this.height)
			.attr("transform", `translate(${this.margins.left},${this.margins.top})`);
		this.rowHeaders = this.g.append("g")
			.attr("transform", `translate(0, ${this.margins.top})`)
			.attr("width", this.margins.left)
			.attr("height", this.height);
		this.colHeaders = this.g.append("g")
			.attr("transform", `translate(${this.margins.left}, 0)`)
			.attr("width", this.width)
			.attr("height", this.margins.top);
		this.cells = this.g.append("g")
			.attr("transform", `translate(${this.margins.left}, ${this.margins.top})`)
			.attr("width", this.width)
			.attr("height", this.height);
	};

	// Update the visuals for this matrix visualization
	this.updateTag = () => {
		const thisMatrix = this;
		const columns = this.graph.length;
		const columnNames = [];
		for (let i = 0; i < columns; ++i)
			columnNames[i] = this.labels ? this.labels[i] : i;
		const gridWidth = this.width / columns;

		// Update row headers
		const rowHeaders = this.rowHeaders.selectAll("text").data(columnNames);
		rowHeaders.exit().remove();
		rowHeaders.enter().append("text")
			.attr("text-anchor", "end")
			.attr("alignment-baseline", "middle")
			.attr("font-size", "50%")
		  .merge(rowHeaders)
			.attr("transform", (d, i) => `translate(${thisMatrix.margins.left}, ${(i + 0.5) * gridWidth})`)
			.text(d => d);

		// Update column headers
		const colHeaders = this.colHeaders.selectAll("text").data(columnNames);
		colHeaders.exit().remove();
		colHeaders.enter().append("text")
			.attr("text-anchor", "start")
			.attr("alignment-baseline", "middle")
			.attr("font-size", "50%")
		  .merge(colHeaders)
			.attr("transform", (d, i) => `translate(${(i + 0.5) * gridWidth}, ${thisMatrix.margins.top})rotate(-90)`)
			.text(d => d);

		// Update matrix
		const cellContents = this.graph.map((row, r) => {
			return row.map((elt, c) => { return {r: r, c: c, value: elt}; });
		}).reduce((a, b) => a.concat(b));
		const foo = cellContents.map(d => Number(d.value));
		const maxValue = cellContents.map(d => d.value).reduce((a, b) => {
			const result = Math.max(a, b);
			if (isNaN(result)) {
				console.log("Got NaN");
			}
			return result;
		});
		const cells = this.cells.selectAll("rect").data(cellContents);
		cells.exit().remove();
		cells.enter().append("rect")
			.attr("width", gridWidth - 2)
			.attr("height", gridWidth - 2)
		  .merge(cells)
			.attr("transform", d => `translate(${d.c * gridWidth + 1}, ${d.r * gridWidth + 1})`)
			.style("fill-opacity", d => Math.sqrt(d.value / maxValue))
			.style("fill", "#102040");
	}
};
