class ExactIndex {

	constructor(exactField) {
		this.index = {};
		this.field = exactField;
	}

	add(key, val) {
		if (this.index[key]) {
			this.index[key].push(val);
		} else {
			this.index[key] = [val];
		}
	}

	// remove the value from the index, if the value was the last one, remove the key
	remove(key, val) {
		let idxSet = this.index[key];
		for (let i in idxSet) {
			if (idxSet[i] == val) {
				idxSet.splice(i, 1);
			}
		}
		if (idxSet.length < 1) {
			this.index[key] = undefined;
		}
	}

	// get the values related to the key, could be more than one
	get(key) {
		return this.index[key];
	}

	// clear will zap the index
	clear(key) {
		this.index = {};
	}

}

module.exports = ExactIndex;