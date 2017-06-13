const AbstractIndex = require('./AbstractIndex');
const ObjectHelper = require('../Helper/ObjectHelper');
const createTree = require('functional-red-black-tree');

/**
 * Uses the black red black tree implementation
 * of https://github.com/mikolalysenko/functional-red-black-tree
 * to create a binary tree index with find.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class BTreeIndex extends AbstractIndex {

	constructor(collection, field){
		super(collection, field);
		this.tree = createTree();
		this.documentMap = [];
		this.path = field;
	}

	addDocument(document){
		let value = this.collection.getCacheManager().getObjectAccessor(this.path)(document);
		this.indexValue(value, document.$fenrir);
	}

	indexValue(value, $fenrir){
		let currentTreeEntryIterator = this.tree.find(value);
		if(currentTreeEntryIterator.value) {
			this.tree = currentTreeEntryIterator.update(currentTreeEntryIterator.value.concat($fenrir));
		} else {
			this.tree = this.tree.insert(value, [$fenrir]);
		}
		this.documentMap[$fenrir] = value;
	}

	removeDocument(document){
		delete this.documentMap[document.$fenrir];
		let iterator = this.tree.find(ObjectHelper.getValueByPath(document, this.path));
		if(iterator.value === [document.$fenrir]) {
			this.tree = this.tree.remove(ObjectHelper.getValueByPath(document, this.path));
		}else{
			this.tree = iterator.update(iterator.value.splice(iterator.value.indexOf(document.$fenrir), 1));
		}
	}

	findDocument(fieldData) {
		console.log('find data:', fieldData);
		return this.tree.find(fieldData).value;
	}

	serialize(){
		return this.documentMap;
	}

	deserialize(serializedIndex){
		Object.keys(serializedIndex).forEach(key => {this.indexValue(serializedIndex[key], key)});
	}

}

module.exports = BTreeIndex;