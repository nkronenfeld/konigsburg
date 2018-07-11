export function setupDatasetChooser (tag, withDataset) {
	var chooser = document.getElementById(tag);
	chooser.onchange = function (event) {
		const selected = chooser.selectedOptions.item(0);
		if (selected) {
			withDataset(selected.value);
		} else {
			withDataset(null);
		}
	};
}
