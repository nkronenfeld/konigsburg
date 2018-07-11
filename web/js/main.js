import {parsePAJ} from './graph';
import * as d3 from "d3";

var svg = d3.select("svg");
var width = +svg.attr("width");
var height = +svg.attr("height");
var color = d3.scaleOrdinal(d3.schemeCategory20);
var simulation = d3.forceSimulation()
	.force("link", d3.forceLink().id(function(d) {return d.id;}))
	.force("attract", d3.forceManyBody().strength(200).distanceMin(2001).distanceMax(10000))
	.force("repel", d3.forceManyBody().strength(-140).distanceMin(0).distanceMax(2000))
	.force("center", d3.forceCenter(width / 2, height / 2));

function dragstarted (d) {
	if (d3.event.active) simulation.alphaTarget(0.3).restart();
	d.fx = d.x;
	d.fy = d.y;
}

function dragged (d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
}

function dragended(d) {
	if (!d3.event.active) simulation.alphaTarget(0);
	d.fx = null;
	d.fy = null;
}

d3.text("../data/Chesapeake.paj", (error, graphData) => {
	var graph = parsePAJ(graphData);

	var link = svg.append("g")
		.attr("class", "links")
		.selectAll("line")
		.data(graph.edges)
		.enter()
		.append("line")
		.attr("stroke-width", d => Math.sqrt(Math.sqrt(d.weight)));

	var node = svg.append("g")
		.attr("class", "nodes")
		.selectAll("circle")
		.data(graph.nodes)
		.enter()
		.append("circle")
		.attr("r", function (d) {return Math.sqrt(Math.sqrt(d["vector bio-masses"]));})
		.attr("fill", function(d) {return color(d["partition ECO types"]); })
		.call(d3.drag()
			  .on("start", dragstarted)
			  .on("drag", dragged)
			  .on("end", dragended));

	node.append("title")
		.text(function(d) {return d.name;});

	simulation
		.nodes(graph.nodes)
		.on("tick", ticked);

	simulation.force("link")
		.links(graph.edges);

	function ticked() {
		link
			.attr("x1", function(d) {return d.source.x; })
			.attr("y1", function(d) {return d.source.y; })
			.attr("x2", function(d) {return d.target.x; })
			.attr("y2", function(d) {return d.target.y; });
		node
			.attr("cx", function(d) {return d.x; })
			.attr("cy", function(d) {return d.y; });
	}
});
