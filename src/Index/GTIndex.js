const AbstractBinarySearchIndex = require('./AbstractBinarySearchIndex');
const BinarySearch = require('binary-search-bounds');
const ObjectHelper = require('../Helper/ObjectHelper');

/**
 * The GTIndex offers an efficient way in querying all documents
 * with a property greater than a supplied value.
 *
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class GTIndex extends AbstractBinarySearchIndex {

	find(fieldData) {
		return this.dataSet.slice(BinarySearch.gt(this.dataSet, fieldData, (cmp, v) => v >= fieldData));
	}

}