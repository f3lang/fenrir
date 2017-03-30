const AbstractIndex = require('./AbstractIndex');

/**
 * The IdIndex keeps track of the $fenrir ids in the database.
 * Gives the Collection a fast way to determine the next free index entry.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class IdIndex extends AbstractIndex {

	constructor(collection) {
		super(collection, '$fenrir');
		this.lastIndex = 0;
	}

	getLastIndex(){
		return this.lastIndex;
	}

	addDocument(document){
		this.lastIndex = document.$fenrir;
	}

	removeDocument(document){
		if(document.$fenrir === this.lastIndex) {
			this.lastIndex--;
		}
	}

	serialize(){
		return {lastIndex: this.lastIndex};
	}

	deserialize(serializedIndex) {
		this.lastIndex = serializedIndex.lastIndex;
	}

}

module.exports = IdIndex;