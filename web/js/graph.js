function clone (obj) {
	return JSON.parse(JSON.stringify(obj));
}

function tokenizeLine (line, separator) {
	const tokens = [];
	let curToken = "";
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

	return tokens.map(token => token.trim())
			.filter(token => token.length > 0);
}

function processCommand (line, state) {
	let tokens = tokenizeLine(line, "/");
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
	const tokens = tokenizeLine(line, " ")
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

function newEdge (source, target, weight) {
	return {
		source: Number(source),
		target: Number(target),
		weight: Number(weight)
	};		
}

function processEdge (line, state, graph) {
	const tokens = tokenizeLine(line, " ")
	if (tokens.length == 3) {
		graph.edges.push(newEdge(tokens[0], tokens[1], tokens[2]));
	}
}

function pajNodeToGraphNode (pajNode) {
	return {
		id: Number(pajNode.id),
		name: pajNode.name,
		type: Number(pajNode["partition ECO types"]),
		value: Number(pajNode["vector bio-masses"])
	};	
}

export function emptyGraph () {
	return {
		nodes: [],
		edges: []
	};
}

export function parsePAJ (pajText) {
	const graph = {
		"nodes": [],
		"edges": []
	};
	const state = {
		"state": "general",
		"fieldNames": [],
		"count": 0,
		"maxCount": 0
	};
	pajText.split("\n").forEach(line => {
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
	graph.nodes = graph.nodes.map(pajNodeToGraphNode);
	return graph;
}


function calculateBestGraphOrder (graph) {
	function getEdgeWeight (source, target) {
		const matchingEdge = graph.edges.find(edge => edge.source == source && edge.target == target);
		if (matchingEdge) {
			return matchingEdge.weight;
		} else {
			return 0;
		}
	}

	const numNodes = graph.nodes.length;
	const nodesLeft = [];
	for (let i = 0; i < numNodes; ++i) {
		nodesLeft.push(graph.nodes[i].id);
	}
	let result = [];
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
		const startSeq = [];
		const endSeq = [];

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
					if (sources[i] != sinks[j]) {
						total = total + getEdgeWeight(sources[i], sinks[j]);
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
			const inDegree = nonSelfDegree(nodesLeft, [node]);
			const outDegree = nonSelfDegree([node], nodesLeft);
			return outDegree - inDegree;
		}						 

		addToStart(nodesLeft[0]);
		addToEnd(nodesLeft[nodesLeft.length - 1]);

		while (nodesLeft.length > 0) {
			// Look for clear sinks
			var clearSinks = nodesLeft.filter(n => sinkScore(n) == 0)
			if (clearSinks.length > 0) {
				clearSinks.forEach(addToEnd);
			} else {
				// Look for clear sources
				const clearSources = nodesLeft.filter( n => sourceScore(n) == 0);
				if (clearSources.length > 0) {
					clearSources.forEach(addToStart);
				} else {
					// No clear sinks or soures; pick our best candidate
					// and move it.
					let bestNode;
					let bestDelta = Number.MIN_VALUE;
					nodesLeft.forEach(n => {
						const delta = degreeDeltaLeft(n);
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
		result = startSeq.concat(endSeq);
	}
	return result;
}

export function optimizeOrder (graph) {
	const order = calculateBestGraphOrder(graph);
	const nodeMap = {};
	for (let i = 0; i < graph.nodes.length; ++i) {
		nodeMap[graph.nodes[i].id] = graph.nodes[i];
	}
	const newNodes = order.map(n => nodeMap[n]);
	const newEdges = graph.edges

	return {
		nodes: newNodes,
		edges: newEdges
	};
}
