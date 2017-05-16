/**
 * The index manager manages indices. whoaa..
 * All jokes aside. All Operators, that make use of indices
 * will search for existing indices in an instance of this class.
 * Each collection has it's own index manager.
 *
 * Furthermore, the collection or the performance manager may
 * create new indices by requesting them from this class
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class IndexManager {

	constructor(collection) {
		this.collection = collection;
	}

    /**
	 *
     * @param path
     * @param type
	 * @returns The index, if there is an index  available in the corresponding collection. Returns false,
	 * if the requested index is not available.
     */
	getIndex(path, type) {
		this.collection.performan
	}

	createIndex(path, type) {

	}

}

module.exports = IndexManager;