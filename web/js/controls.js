import {aggregateGraph, optimizeOrder} from './graph';

export function setupDatasetChooser (tag, titleTag, withDataset) {
	const chooser = document.getElementById(tag);
	const title = document.getElementById(titleTag);
	chooser.onchange = function (event) {
		const selected = chooser.selectedOptions.item(0);
		if (selected) {
			title.innerHTML = selected.label;
			withDataset(selected.value);
			chooser.value = "";
		} else {
			withDataset(null);
		}
	};
}

export function setupOrderOptimization (tag, getCurrentGraph, withNewGraph) {
	const button = document.getElementById(tag);
	button.onclick = function (event) {
		withNewGraph(optimizeOrder(getCurrentGraph()));
	}
}

export function setupTextBasedAggregation (orderFieldTag, aggregateButtonTag, getCurrentGraph, withNewGraph) {
	const button = document.getElementById(aggregateButtonTag);
	const orderField = document.getElementById(orderFieldTag)

	button.onclick = function (event) {
		withNewGraph(
			aggregateGraph(getCurrentGraph(),
						   JSON.parse(orderField.value))
		);
	}
}

export function setGraphOrderField (orderFieldTag, currentGraph) {
	const orderField = document.getElementById(orderFieldTag);
	orderField.value = JSON.stringify(currentGraph.nodes.map(n => n.id));
}
