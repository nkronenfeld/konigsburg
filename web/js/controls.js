import {optimizeOrder} from './graph';

export function setupDatasetChooser (tag, withDataset) {
	const chooser = document.getElementById(tag);
	chooser.onchange = function (event) {
		const selected = chooser.selectedOptions.item(0);
		if (selected) {
			withDataset(selected.value);
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
