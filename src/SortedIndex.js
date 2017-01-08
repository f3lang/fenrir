const Utils = require('./Utils');

class SortedIndex {

	constructor(sortedField) {
		this.field = sortedField;
		this.keys = [];
		this.values = [];
	}

	// set the default sort
	static sort(a, b) {
		return (a < b) ? -1 : ((a > b) ? 1 : 0);
	}

	bs() {
		return new Utils.BSonSort(SortedIndex.sort);
	}

	// and allow override of the default sort
	setSort(fun) {
		this.bs = new Utils.BSonSort(fun);
	}

	// add the value you want returned  to the key in the index
	set(key, value) {
		let pos = Utils.binarySearch(this.keys, key, SortedIndex.sort);
		if (pos.found) {
			this.values[pos.index].push(value);
		} else {
			this.keys.splice(pos.index, 0, key);
			this.values.splice(pos.index, 0, [value]);
		}
	}

	// get all values which have a key == the given key
	get(key) {
		let bsr = Utils.binarySearch(this.keys, key, SortedIndex.sort);
		if (bsr.found) {
			return this.values[bsr.index];
		} else {
			return [];
		}
	}

	// get all values which have a key < the given key
	getLt(key) {
		let bsr = Utils.binarySearch(this.keys, key, SortedIndex.sort);
		let pos = bsr.index;
		if (bsr.found) pos--;
		return this.getAll(key, 0, pos);
	}

	// get all values which have a key > the given key
	getGt(key) {
		let bsr = Utils.binarySearch(this.keys, key, SortedIndex.sort);
		let pos = bsr.index;
		if (bsr.found) pos++;
		return this.getAll(key, pos, this.keys.length);
	}

	// get all vals from start to end
	getAll(key, start, end) {
		let results = [];
		for (let i = start; i < end; i++) {
			results = results.concat(this.values[i]);
		}
		return results;
	}

	// just in case someone wants to do something smart with ranges
	getPos(key) {
		return Utils.binarySearch(this.keys, key, SortedIndex.sort);
	}

	// remove the value from the index, if the value was the last one, remove the key
	remove(key, value) {
		let pos = Utils.binarySearch(this.keys, key, SortedIndex.sort).index;
		let idxSet = this.values[pos];
		for (let i in idxSet) {
			if (idxSet[i] == value) idxSet.splice(i, 1);
		}
		if (idxSet.length < 1) {
			this.keys.splice(pos, 1);
			this.values.splice(pos, 1);
		}
	}

	// clear will zap the index
	clear() {
		this.keys = [];
		this.values = [];
	}

}

module.exports = SortedIndex;