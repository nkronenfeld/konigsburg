import {parsePAJ} from './graph';
import {initializeGraphView} from './graphView';
import * as selection from 'd3-selection';
import * as shape from 'd3-shape';
import * as drag from 'd3-drag';
import * as scale from 'd3-scale';
import * as request from 'd3-request';

let svg = selection.select("svg");
let width = +svg.attr("width");
let height = +svg.attr("height");
let color = scale.scaleOrdinal(scale.schemeCategory20);

request.text("../data/Chesapeake.paj", (error, graphData) => {
	const graph = parsePAJ(graphData);
	initializeGraphView(graph);
});
