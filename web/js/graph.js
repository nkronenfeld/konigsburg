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
		edges: [],
		aggregateType: 0
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
	graph.aggregateType = graph.nodes.map(node => node.type).reduce((a, b) => {
		return Math.max(Number(a), Number(b));
	}, 0) + 5;
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
		edges: newEdges,
		aggregateType: graph.aggregateType
	};
}

export function randomlyReorder (graph) {
	const oldNodes = graph.nodes.map(clone);
	const newNodes = [];
	while (oldNodes.length > 0) {
		const i = Math.floor(Math.random() * oldNodes.length);
		newNodes.push(oldNodes[i]);
		oldNodes.splice(i, 1);
	}
	return {
		nodes: newNodes,
		edges: graph.edges,
		aggregateType: graph.aggregateType
	};
}

// Change from a serial aggregation description (a list of nodes or lists of
// nodes that get aggregated together) into a transformation object that can
// tell from what node a new node comes or to what node an old node goes
// Input format: array[either[array, id]]
//
// Also, check aggregation to make sure:
//  (a) there are no duplicates
//  (b) all original nodes are accounted for
function getAggregationTransformation (aggregation, nodes) {
	const newIdMap = {};
	const oldIds = [];
	function addNewId (oldId, index) {
		if (newIdMap[oldId]) {
			throw `duplicate ID ${oldId}`;
		}
		newIdMap[oldId] = index + 1;
		oldIds.push(index + 1);
	}
	aggregation.forEach((a, n) => {
		if (Array.isArray(a)) {
			a.forEach(aa => addNewId(aa, n));
		} else {
			addNewId(a, n);
		}
	});
	const newIds = aggregation.map((n, i) => i + 1);

	// Check to make sure all IDs are accounted for
	oldIds.forEach(id => nodes.splice(nodes.indexOf(id), 1))
	if (nodes.length > 0) {
		throw `Not all nodes accounted for in aggregation ${JSON.stringify(aggregation)}.  Nodes left: ${JSON.stringify(nodes)}`;
	}

	// Return our pieces
	return {
		oldIds: oldIds,
		newIds: newIds,
		newIdOf: oldId => newIdMap[oldId],
		oldIdsOf: newId => aggregation[newId]
	}
}

export function aggregateGraph (graph, aggregation) {
	const transform = getAggregationTransformation(aggregation, graph.nodes.map(n => n.id));

	// Aggregate nodes
	const nodeMap = {};
	graph.nodes.forEach(node => {
		const newId = transform.newIdOf(node.id);
		if (nodeMap[newId]) {
			nodeMap[newId].name = `${nodeMap[newId].name}:${node.name}`;
			nodeMap[newId].type = graph.aggregateType;
			nodeMap[newId].value = nodeMap[newId].value + node.value;
		} else {
			nodeMap[newId] = {
				name: node.name,
				id: newId,
				type: node.type,
				value: node.value
			};
		}
	});
	const nodes = Object.values(nodeMap).sort((a, b) => a.id - b.id);

	// Aggregate edges
	const edgeMap = {};
	graph.edges.forEach(edge => {
		const newSrc = transform.newIdOf(edge.source);
		const newTgt = transform.newIdOf(edge.target);
		const newKey = JSON.stringify({src: newSrc, tgt: newTgt});
		if (edgeMap[newKey]) {
			edgeMap[newKey].weight = edgeMap[newKey].weight + edge.weight;
		} else {
			edgeMap[newKey] = newEdge(newSrc, newTgt, edge.weight);
		}
	});
	const edges = Object.values(edgeMap);
	return {
		nodes: nodes,
		edges: edges,
		aggregateType: graph.aggregateType
	};
}
