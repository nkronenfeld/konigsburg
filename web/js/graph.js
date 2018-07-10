function tokenizeLine (line, separator) {
	return line.split(separator)
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

