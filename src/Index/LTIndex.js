const AbstractBinarySearchIndex = require('./AbstractBinarySearchIndex');
const BinarySearch = require('binary-search-bounds');

/**
 * The LTIndex is the counterpart to the GTIndex.
 * It offers a fast way to retrieve all documents, that
 * have a value smaller than the supplied one
 */
class LTIndex extends AbstractBinarySearchIndex {

	find(fieldData){
		return this.dataSet.slice(0, BinarySearch.lt(this.dataSet, fieldData, (cmp, v) => v <= fieldData));
	}

}

module.exports = LTIndex;