const AbstractIndex = require('./AbstractIndex');
const ObjectHelper = require('../Helper/ObjectHelper');
const BinarySearch = require('binary-search-bounds');

/**
 * The Abstract Binary Search Index keeps track of the document
 * in an ordered Array, which is ordered with the standard comparator.
 *
 * The data is stored in the dataSet variable. Each set in the dataSet
 * Variable has two properties, on one hand the $fenrir id of the target
 * object and on the other hand the value of the object at the path.
 *
 * So the dataSet looks like this: [{$fenrir: 5, data: 'Meier'}, {$fenrir: 2, data:'Mueller'}]
 *
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class AbstractBinarySearchIndex extends AbstractIndex {

	constructor(collection, field) {
		if(new.target === AbstractBinarySearchIndex) {
			throw new TypeError('Cannot use AbstractBinarySearchIndex directly. Use a derived class.');
		}
		super(collection, field);
		this.dataSet = [];
		this.indexMap = [];
		this.path = field;
	}

	addDocument(document){
		let value = ObjectHelper.getValueByPath(document, this.path);
		this.indexMap[document.$fenrir] = {$fenrir: document.$fenrir, data: value};
		this.dataSet.splice(BinarySearch.ge(this.dataSet, value, (cmp, v) => v <= cmp.data), 0, this.indexMap[document.$fenrir]);
	}

	removeDocument(document) {
		this.dataSet.splice(BinarySearch.eq(this.dataSet, document.$fenrir, (cmp, v) => cmp.$fenrir === document.$fenrir), 1);
		delete this.indexMap[document.$fenrir];
	}

	updateDocument(document){
		this.indexMap[document.$fenrir].data = ObjectHelper.getValueByPath(document, this.path);
	}

}

module.exports = AbstractBinarySearchIndex;