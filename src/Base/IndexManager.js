/**
 * The index manager manages indices. whoaa..
 * All jokes aside. All Operators, that make use of indices
 * will search for existing indices in this class.
 *
 * Furthermore, the collection or the performance manager may
 * create new indices by requesting them from this class
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class IndexManager {

	constructor(collection) {
		this.collection = collection;
	}

	getIndex(path, type){

	}

	createIndex(path, type){

	}

}

module.exports = IndexManager;