import * as selection from 'd3-selection'; 
import * as shape from 'd3-shape'; 
import * as drag from 'd3-drag'; 
import * as scale from 'd3-scale'; 
import * as request from 'd3-request';

import {initializeGraphView} from './graphView'; 
import {emptyGraph, parsePAJ} from './graph';
import * as controls from './controls';
import {MatrixVis} from './matrix';


function clone (obj) {
	return JSON.parse(JSON.stringify(obj));
}

const matrix = new MatrixVis("matrix")
matrix.setupTag();
let currentGraph = emptyGraph();

function updateGraph (graph) {
	currentGraph = clone(graph);

	initializeGraphView(currentGraph);
	
	matrix.setGraph(currentGraph);
	matrix.updateTag();
}

controls.setupDatasetChooser("dataset", dataset => {
	if ("" == dataset) {
		updateGraph(emptyGraph());
	} else {
		request.text(`../data/${dataset}`, (error, graphData) => {
			updateGraph(error ? emptyGraph() : parsePAJ(graphData));
		});
	}
});

controls.setupOrderOptimization("reorder", () => currentGraph, updateGraph);
