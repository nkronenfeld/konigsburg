// Matrix visualization of a graph

import * as d3 from "d3";

export function MatrixVis (tag, id) {
	this.tag = tag;
	this.id = id;
	this.graph = null;

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
	};

	// Update the visuals for this matrix visualization
	this.updateTag = () => {
		let selector = tag;
		if (id) {
			selector = selector + "#" + this.id;
		}
		const columns = this.graph.length
		//		const width = (100.0 / columns) +"%";
		const base = d3.select(selector);
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
	}
};
