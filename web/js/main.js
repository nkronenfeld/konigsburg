d3.text("../data/Chesapeake.paj", function(error, graphData) {
	if (error) throw error;

//	graphData.split("\n").forEach(function (line) {
//		var elt = document.getElementById("text-data")
//		elt.innerHTML = elt.innerHTML + "<br>" + line;
//	});
	var graph = parsePAJ(graphData);
	var elt = document.getElementById("text-data")
	elt.innerHTML = elt.innerHTML + JSON.stringify(graph);
});
