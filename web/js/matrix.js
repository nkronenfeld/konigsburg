// Matrix visualization of a graph

function MatrixVis (tag) {
	this.tag = tag;
	this.graph = null;

	this.setGraph = function (newGraph) {
		var graphSize = newGraph.nodes.length;
		var newMatrix = [];
		for (var i = 0; i < graphSize; ++i) {
			newMatrix[i] = [];
			for (var j = 0; j < graphSize; ++j) {
				newMatrix[i][j] = 0;
			}
		}
		for (var i = 0; i < newGraph.edges.length; ++i) {
			var edge = newGraph.edges[i];
			newMatrix[edge.source][edge.target] = edge.weight;
		}
		this.graph = newMatrix;
	};

	this.updateTag = function () {
		var selector = "p["+this.tag+"]";
		var base = d3.select(selector);
		var table = base.append("table")
		var tr = table.selectAll("tr")
			.data(this.graph)
		tr.exit().remove();
		var rows = tr.enter().append("tr");
		var td = rows.selectAll("td")
			.data(function (d) {return d;})
		td.exit().remove();
		td.enter().append("td")
			.text(function (d) { return d; });
	}
};
