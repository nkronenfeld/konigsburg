function tokenizeLine (line, separator) {
	var tokens = [];
	var curToken = "";
	for (var i = 0; i < line.length; i++) {
		if (line[i] == '"') {
			i = i + 1;
			while (i < line.length && line[i] != '"') {
				curToken = curToken + line[i];
				i = i + 1;
			}
		} else if (line[i] == separator) {
			tokens.push(curToken);
			curToken = "";
		} else {
			curToken = curToken + line[i];
		}
	}
	tokens.push(curToken);

	return tokens
		.map(function (token) {
			return token.trim();
		}).filter(function (token) {
			return token.length > 0;
		});
}
function processCommand (line, state) {
	var tokens = tokenizeLine(line, "/");
	if (tokens.length > 1) {
		state.fieldNames = [tokens[0]];
	} else {
		tokens = tokenizeLine(line, " ");
		switch (tokens[0]) {
			case "network": {
				state.fieldNames = ["id", "name"];
				break;
			}
			case "vertices": {
				state.state = "nodes";
				state.maxCount = tokens[1];
				state.count = 0;
				break;
			}
			case "arcs": {
				state.state = "edges";
				break;
			}
		}
	}
}
function processNode (line, state, graph) {
	var tokens = tokenizeLine(line, " ")
	if (tokens.length == state.fieldNames.length &&
		state.count < state.maxCount) {
		var node = graph.nodes[state.count];
		if (!node) {
			node = {};
			graph.nodes[state.count] = node;
		}
		for (var i = 0; i < tokens.length; ++i) {
			node[state.fieldNames[i]] = tokens[i];
		}
		state.count = state.count + 1;
	}
}
function processEdge (line, state, graph) {
	var tokens = tokenizeLine(line, " ")
	if (tokens.length == 3) {
		graph.edges.push({
			"source": tokens[0],
			"target": tokens[1],
			"weight": tokens[2]
		});
	}
}
function parsePAJ (pajText) {
	var graph = {
		"nodes": [],
		"edges": []
	};
	var state = {
		"state": "general",
		"fieldNames": [],
		"count": 0,
		"maxCount": 0
	};
	pajText.split("\n").forEach(function (line) {
		if (line.startsWith("%")) {
			// ignore
		} else if (line.startsWith("*")) {
			processCommand(line.slice(1), state);
		} else {
			switch (state.state) {
				case "nodes": {
					processNode(line, state, graph);
					break;
				}
				case "edges": {
					processEdge(line, state, graph);
					break;
				}
			}
		}
	});
	return graph;
}


function calculateBestGraphOrder (graph) {
	function getEdgeWeight (source, target) {
		val matchingEdge = graph.edges.find(function (edge) {
			return edges.source == source && edges.target == target;
		});
		if (matchingEdge) {
			return matchingEdge.weight;
		} else {
			return 0;
		}
	}

	var numNodes = graph.nodes.length();
	var nodesLeft = [];
	for (var i = 0; i < numNodes; ++i) {
		nodesLeft.push(i);
	}
	var result = [];
	if (numNodes < 2) {
		result = nodesLeft;
	} else {
		// This probably better reordering algorithm can be found at
		// https://pdfs.semanticscholar.org/c7ed/d9acce96ca357876540e19664eb9d976637f.pdf
		//
		// Short form:
		//  procedure GR (G: DiGraph; var s: VertexSequence);
		//    s1 <- {}; s2 <- [];
		//  while G != {} do
		//    { while G contains a sink do
		//      { choose a sink u; s2 <= u s2; G <= G - u};
		//      while G contains a source do
		//      { choose a source u; s1 <= s1 u; G <= G - u};
		//      choose a vertex u for which delta(u) is a maximum;
		//      s1 <= s1 u; G <= G - u};
		//  s <= s1 s2
		var startSeq = [];
		var endSeq = [];

		function addToStart (i) {
			nodesLeft.splice(nodesLeft.indexOf(i), 1);
			startSeq.push(i);
		}
		function addToEnd (i) {
			nodesLeft.splice(nodesLeft.indexOf(i), 1);
			endSeq.unshift(i);
		}
		function nonSelfDegree (sources, sinks) {
			var total = 0;
			for (var i = 0; i < sources.length; ++i) {
				for (var j = 0; j < sinks.length; ++j) {
					if (sources(i) != sinks(j)) {
						total = total + getEdgeWeight(sources(i), sinks(j));
					}
				}
			}
			return total;
		}
		function sinkScore (node) {
			return nonSelfDegree([node], nodesLeft);
		}
		function sourceScore (node) {
			return nonSelfDegree(nodesLeft, [node]);
		}
		function degreeDeltaLeft (node) {
			var inDegree = nonSelfDegree(nodesLeft, [node]);
			var outDegree = nonSelfDegree([node], nodesLeft);
			return outDegree - inDegree;
		}						 

		addToStart(0);
		addToEnd(numNodes - 1);

		while (nodesLeft.length > 0) {
			// Look for clear sinks
			var clearSinks = nodesLeft.filter(function (n) {
				return sinkScore(n) == 0
			});
			if (clearSinks.length > 0) {
				clearSinks.forEach(addToEnd);
			} else {
				// Look for clear sources
				var clearSources = nodesLeft.filter(function(n) {
					return sourceScore(n) == 0;
				});
				if (clearSources.length > 0) {
					clearSources.forEach(addToStart);
				} else {
					// No clear sinks or soures; pick our best candidate
					// and move it.
					var bestNode;
					var bestDelta = Number.MIN_VALUE;
					nodesLeft.forEach(function (n) {
						var delta = degreeDeltaLeft(n);
						if (Math.abs(delta) > Math.abs(bestDelta)) {
							bestDelta = delta;
							bestNode = n;
						}
					});
					if (bestDelta > 0) {
						addToStart(bestNode);
					} else {
						addToEnd(bestNode);
					}
				}
			}
		}
	}
	return startSeq.concat(endSeq);
}
