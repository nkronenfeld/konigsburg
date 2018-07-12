import * as selection from 'd3-selection';
import * as shape from 'd3-shape';
import * as drag from 'd3-drag';
import * as scale from 'd3-scale';
import * as request from 'd3-request';

const dropYPos = 100;
const mainXPos = 50;
const mainYPos = 200;
const arcRatio = 0.25;

let graphNodes = null;
let graphLinks = null;
let dropLine = null;
const svg = selection.select("svg#fd-graph");

const width = +svg.attr("width");
const height = +svg.attr("height");
const xMargin = 25;

let color = scale.scaleOrdinal(scale.schemeCategory20);

let graph = null;
let nodePositions = null;
let edgePositions = null;

let startYPos = 0;

// saves the start vertical location so that we can snap back to it
function dragstarted(d) {
	startYPos = nodePositions.get(d.id).y;
}

// updates the node and its corresponding edges
function dragged (d) {
	nodePositions.get(d.id).y = selection.event.y;
	selection.select(this).attr("cy", selection.event.y);
	updateEdges(d);
}

// updates the node and its corresponding edges, snapping back
// to the start location if it is not near enough to the drop line
function dragended(d) {
	if (Math.abs(dropYPos - selection.event.y) < 25) {
		nodePositions.get(d.id).y = dropYPos;
        selection.select(this).attr("cy", dropYPos);
        d.line = 1;        
	} else if (Math.abs(mainYPos - selection.event.y) < 25) {
		nodePositions.get(d.id).y = mainYPos;
        selection.select(this).attr("cy", mainYPos);
        d.line = 0;
	} else {
		nodePositions.get(d.id).y = startYPos;
		selection.select(this).attr("cy", startYPos);
	}
	updateEdges(d);
}

// generates curves for path visuals
const lineGenerator = shape.line()
	.x(d => d.x)
	.y(d => d.y)
	.curve(shape.curveBasis)

function genKey(edge) {
    return `${edge.source}:${edge.target}`;
}

function updateEdges(d) {
	const edges = graph.edges.filter(e => e.source === d.id || e.target === d.id);
	edges.forEach(e => {
		const pos = computeEdgePosition(e, nodePositions, arcRatio);
		edgePositions.set(genKey(e), pos);
	});
	selection.selectAll("path")
		.filter(e => e.source === d.id || e.target === d.id)
		.attr("d", d => lineGenerator(edgePositions.get(genKey(d))));
}

function computeNodePositions(xOffset, yOffset, width, height, nodes) {
    const nodePositions = new Map();
    const spacing = width / nodes.length;
    nodes.forEach((node, idx) => {
        nodePositions.set(node.id,
        {
            x: xOffset + (idx * spacing),
            y: yOffset + (node.line && node.line === 1 ? dropYPos : 0)
        })
    });
    return nodePositions;
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
		edgePositions.set(genKey(edge), pos);
	})
    return edgePositions;
}

// main function to set/update graph data
export function initializeGraphView(graphData) {
    graph = graphData;
    nodePositions = computeNodePositions(mainXPos, mainYPos, width - xMargin, 50, graph.nodes);
    edgePositions = computeEdgePositions(graph.edges, nodePositions, arcRatio);

    if (graphNodes == null || graphLinks == null) {
        graphLinks = svg.append("g")
            .attr("id", "graph-links")
            .attr("class", "links");
        
        graphNodes = svg.append("g")
            .attr("id", "graph-nodes")
            .attr("class", "nodes");

        dropLine = svg.append("g")
            .attr("id", "graph-drop")
            .attr("class", "dropLine")            
            .append("line")
            .attr("stroke-dasharray", "6, 2")
            .attr("x1", 0)
            .attr("y1", dropYPos)
            .attr("x2", 960)
            .attr("y2", dropYPos)
    }

    const link = graphLinks.selectAll("path").data(graph.edges);
    link.exit().remove();
    link.enter()
        .append("path")
      .merge(link)
        .attr("stroke-width", d => Math.sqrt(Math.sqrt(Math.sqrt(d.weight))))
        .attr("d", d => lineGenerator(edgePositions.get(genKey(d))));
        
    const node = graphNodes.selectAll("circle").data(graph.nodes);
    node.exit().remove();
    node.enter()
        .append("circle")
        .call(drag.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
      .merge(node)
        .attr("r", d => 4 + Math.sqrt(Math.sqrt(d.value)))
        .attr("fill", d => color(d.type))
        .attr("cx", d => nodePositions.get(d.id).x)
        .attr("cy", d => nodePositions.get(d.id).y);
    
    node.append("title")
        .text(d => d.name);
}
