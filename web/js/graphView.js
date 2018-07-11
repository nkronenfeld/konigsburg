import * as selection from 'd3-selection';
import * as shape from 'd3-shape';
import * as drag from 'd3-drag';
import * as scale from 'd3-scale';
import * as request from 'd3-request';

const dropYPos = 100;
const mainXPos = 50;
const mainYPos = 200;
const arcRatio = 0.25;

let svg = selection.select("svg");
let width = +svg.attr("width");
let height = +svg.attr("height");
let color = scale.scaleOrdinal(scale.schemeCategory20);

let graph = null;
let positions = null;
let edgePositions = null;

let startYPos = 0;

function dragstarted(d) {
	startYPos = positions.get(d.id).y;
}

function dragged (d) {
	positions.get(d.id).y = selection.event.y;
	selection.select(this).attr("cy", selection.event.y);
	updateEdges(d);
}

function dragended(d) {
	if (Math.abs(dropYPos - selection.event.y) < 25) {
		positions.get(d.id).y = dropYPos;
		selection.select(this).attr("cy", dropYPos);
	} else if (Math.abs(mainYPos - selection.event.y) < 25) {
		positions.get(d.id).y = mainYPos;
		selection.select(this).attr("cy", mainYPos);
	} else {
		positions.get(d.id).y = startYPos;
		selection.select(this).attr("cy", startYPos);
	}
	updateEdges(d);
}

const lineGenerator = shape.line()
	.x(d => d.x)
	.y(d => d.y)
	.curve(shape.curveBasis)

function updateEdges(d) {
	const edges = graph.edges.filter(e => e.source === d.id || e.target === d.id);
	edges.forEach(e => {
		const pos = computeEdgePosition(e, positions, arcRatio);
		edgePositions.set(d.id, pos);
	});
	selection.selectAll("path")
		.filter(e => e.source === d.id || e.target === d.id)
		.attr("d", d => lineGenerator(edgePositions.get(d.source)));
}

function computeLayout(xOffset, yOffset, width, height, nodes) {
    const positions = new Map();
    const spacing = width / nodes.length;
    nodes.forEach((node, idx) => {
        positions.set(node.id,
        {
            x: xOffset + (idx * spacing),
            y: yOffset
        })
    });
    return positions;
}

function computeEdgePosition(edge, nodePositions, arcRatio) {
	const p0 = nodePositions.get(edge.source);
	const p1 = nodePositions.get(edge.target);
	const mid = {x: p0.x + (p1.x - p0.x) / 2.0, y: p0.y + (p1.x - p0.x) * arcRatio }
	return [p0, mid, p1];
}

function computeEdgePositions(edges, nodePositions, arcRatio) {
    const edgePositions = new Map();
	edges.forEach(edge => {
		const pos = computeEdgePosition(edge, nodePositions, arcRatio);
		edgePositions.set(edge.source, pos);
	})
    return edgePositions;
}

export function initializeGraphView(graphData) {
    graph = graphData;
    positions = computeLayout(mainXPos, mainYPos, 960, 10, graph.nodes);
    edgePositions = computeEdgePositions(graph.edges, positions, arcRatio);

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(graph.edges)
        .enter()
        .append("path")
        .attr("stroke-width", d => Math.sqrt(Math.sqrt(Math.sqrt(d.weight))))
        .attr("d", d => lineGenerator(edgePositions.get(d.source)));
        
    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("r", d => Math.sqrt(Math.sqrt(d["vector bio-masses"])))
        .attr("fill", d => color(d["partition ECO types"]))
        .attr("cx", d => positions.get(d.id).x)
        .attr("cy", d => positions.get(d.id).y)
        .call(drag.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

    const dropLine = svg.append("g")
        .attr("class", "dropLine")
        .append("line")
        .attr("x1", 0)
        .attr("y1", dropYPos)
        .attr("x2", 960)
        .attr("y2", dropYPos)
        
    node.append("title")
        .text(d => d.name);
}
