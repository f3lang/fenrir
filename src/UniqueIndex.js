class UniqueIndex {

	constructor(uniqueField){
		this.field = uniqueField;
		this.keyMap = {};
		this.lokiMap = {};
	}

	set(obj) {
		let fieldValue = obj[this.field];
		if (obj.$loki && fieldValue !== null && typeof (fieldValue) !== 'undefined') {
			if (this.keyMap[fieldValue]) {
				throw new Error('Duplicate key for property ' + this.field + ': ' + fieldValue);
			} else {
				this.keyMap[fieldValue] = obj;
				this.lokiMap[obj.$loki] = fieldValue;
			}
		}
	}

	get(key) {
		return this.keyMap[key];
	}

	byId(id) {
		return this.keyMap[this.lokiMap[id]];
	}

	update(obj, doc) {
		if (this.lokiMap[obj.$loki] !== doc[this.field]) {
			let old = this.lokiMap[obj.$loki];
			this.set(doc);
			// make the old key fail bool test, while avoiding the use of delete (mem-leak prone)
			this.keyMap[old] = undefined;
		} else {
			this.keyMap[obj[this.field]] = doc;
		}
	}

	remove(key) {
		let obj = this.keyMap[key];
		if (obj !== null && typeof obj !== 'undefined') {
			this.keyMap[key] = undefined;
			this.lokiMap[obj.$loki] = undefined;
		} else {
			throw new Error('Key is not in unique index: ' + this.field);
		}
	}

	clear() {
		this.keyMap = {};
		this.lokiMap = {};
	}
}

module.exports = UniqueIndex;