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

	return tokens.map(token => token.trim())
			.filter(token => token.length > 0);
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

export function parsePAJ (pajText) {
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
	return graph;
}

