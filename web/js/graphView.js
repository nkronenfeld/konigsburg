import * as selection from 'd3-selection';
import * as shape from 'd3-shape';
import * as drag from 'd3-drag';
import * as scale from 'd3-scale';
import * as request from 'd3-request';

const dropYPos = 150;
const mainXPos = 50;
const mainYPos = 300;
const arcRatio = 0.25;

let graphNodes = null;
let graphLinks = null;
let dropLine = null;
const svg = selection.select("svg#fd-graph");

const width = +svg.attr("width");
const height = +svg.attr("height");

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
	
	selection.select(this)
		.attr("transform", d => `translate(${nodePositions.get(d.id).x},${nodePositions.get(d.id).y})`);
	
	updateEdges(d);
}

// updates the node and its corresponding edges, snapping back
// to the start location if it is not near enough to the drop line
function dragended(d) {
	if (Math.abs(dropYPos - selection.event.y) < 25) {
		nodePositions.get(d.id).y = dropYPos;
		selection.select(this)
			.attr("transform", d => `translate(${nodePositions.get(d.id).x},${nodePositions.get(d.id).y})`);
        d.line = 1;        
	} else if (Math.abs(mainYPos - selection.event.y) < 25) {
		nodePositions.get(d.id).y = mainYPos;
		selection.select(this)
			.attr("transform", d => `translate(${nodePositions.get(d.id).x},${nodePositions.get(d.id).y})`);
        d.line = 0;
	} else {
		nodePositions.get(d.id).y = startYPos;
		selection.select(this)
			.attr("transform", d => `translate(${nodePositions.get(d.id).x},${nodePositions.get(d.id).y})`);
	}
	updateEdges(d);
}

// generates curves for path visuals
const lineGenerator = shape.line()
	.x(d => d.x)
	.y(d => d.y)
	.curve(shape.curveBasis)

// create a unique key from source/target
function genKey(edge) {
    return `${edge.source}:${edge.target}`;
}

// updates the edges in a definitely non-d3 way
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

// performs linear node layout along a primary or secondary axis
function computeNodePositions(xOffset, yOffset, width, height, nodes) {
    const nodePositions = new Map();
    const spacing = (width - xOffset) / nodes.length;
    nodes.forEach((node, idx) => {
        nodePositions.set(node.id,
        {
            x: xOffset + (idx * spacing),
            y: yOffset - (node.line && node.line === 1 ? dropYPos : 0)
        })
    });
    return nodePositions;
}

// computes vertex positions for a single edge
function computeEdgePosition(edge, nodePositions, arcRatio) {
	const p0 = nodePositions.get(edge.source);
	const p1 = nodePositions.get(edge.target);
	const mid = {x: p0.x + (p1.x - p0.x) / 2.0, y: p0.y + (p1.x - p0.x) * arcRatio }
	return [p0, mid, p1];
}

// computes vertex positions for edges based on previously laid out nodes
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
    nodePositions = computeNodePositions(mainXPos, mainYPos, width, 50, graph.nodes);
    edgePositions = computeEdgePositions(graph.edges, nodePositions, arcRatio);

    // do one-time init of visual roots
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
            .attr("x1", mainXPos)
            .attr("y1", dropYPos)
            .attr("x2", width)
            .attr("y2", dropYPos)
    }

    // setup / update the graph links
	const maxEdgeWeight = graph.edges.map(edge => Number(edge.weight))
		  .reduce((a, b) => Math.max(Number(a), Number(b)), 1);
    const link = graphLinks.selectAll("path").data(graph.edges);
    link.exit().remove();
    link.enter()
        .append("path")
      .merge(link)
        .attr("stroke-width", d => 20 * d.weight / maxEdgeWeight)
        .attr("d", d => lineGenerator(edgePositions.get(genKey(d))));
        
    // setup / update the graph nodes
    const node = graphNodes.selectAll("g").data(graph.nodes);
    node.exit().remove();
    const unmergedNodeRoots = node.enter()
          .append("g")
          .call(drag.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended));
	unmergedNodeRoots.append("text");
	unmergedNodeRoots.append("circle");

	const mergedNodeRoots = unmergedNodeRoots.merge(node)
		  .attr("transform", d => `translate(${nodePositions.get(d.id).x},${nodePositions.get(d.id).y})`);
	mergedNodeRoots.select("text")
		.text(d => d.name)
		.attr("transform", d => `rotate(-60)translate(10, 0)`);
	mergedNodeRoots.select("circle")
        .attr("r", d => 4 + Math.sqrt(Math.sqrt(d.value)))
        .attr("fill", d => color(d.type));
}

