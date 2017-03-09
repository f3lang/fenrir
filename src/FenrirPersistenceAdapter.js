/**
 * The FenrirPersistentAdapter represents a persistent adapter working on object level.
 * You can insert data and indexes separately, the PersistenceAdapter will handle both
 * the best way possible.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class FenrirPersistenceAdapter {

	/**
	 * Creates a new FenrirPersistenceAdapter instance. You have to specify the objectIdentifierProperty to
	 * help the Adapter identify the objects and create it's own indexes efficiently. Same counts for the
	 * indexEntryIdentifierProperty. When you don't define an indexEntryIdentifierProperty, the whole index
	 * would have to be rewritten each time an entry is updated.
	 * @param {String} objectIdentifierProperty The identifying property of an object. Normally $fenrir
	 * @param {String} indexEntryIdentifierProperty The identifying property of an index entry. Normally $fenrirIndex
	 * @param {Object} options Arbitrary options necessary for derived implementations of this class.
	 */
	constructor(collection, objectIdentifierProperty = '$fenrir', indexEntryIdentifierProperty = '$fenrirIndex', options = {}) {
		if (new.target === FenrirPersistenceAdapter) {
			throw new TypeError("Cannot use FenrirPersistenceAdapter directly. Use a derived class");
		}
		this.objectIdentifierProperty = objectIdentifierProperty;
		this.indexEntryIdentifierProperty = indexEntryIdentifierProperty;
		this.options = options;
		// bind collection fields to the persistence adapter
		this.collection = collection;

		// The recursive Object handler implements an object watcher, so we can save every change
		// made to objects
		let recursiveHandler = {
			set: (target, key, value) => {
				this.updateObject(target, key);
				if(typeof value === 'object') {
					target[key] = new Proxy(value, recursiveHandler);
				}else{
					target[key] = value;
				}
			}
		};

		this.collection.data = new Proxy()

		this.collection.data._push = this.collection.data.push;
		this.collection.data.push = (obj) => {
			this.addObject(obj);
			this.collection.data._push(obj);
		};

		this.collection.data = {
			get length() {
				return 0;
			},
			push(object) {

			}
		};

		this.collection.idIndex._push = this.collection.idIndex.push;
		this.collection.idIndex.push = ($loki) => {
			this.collection.idIndex._push($loki);
		}
	}

	/**
	 * Wipes existing persisted indexes and overrides it with index.
	 * Returns a Promise, which resolves, when the index is completely written and the storage is consistent
	 * @abstract
	 * @param {Array} index The complete Index with all entries to write
	 * @returns Promise A Promise, that resolves, when the index is completely written.
	 */
	writeIndex(index) {
	}

	/**
	 * Updates a single indexEntry.
	 * @abstract
	 * @param {Object} indexEntry The indexEntry to update. Must include the defined IndexEntryIdentifierProperty
	 * @returns Promise A Promise, that resolves, when the index entry is updated. Rejects, if the specified
	 * Index doesn't exist
	 */
	updateIndexEntry(indexEntry) {
	}

	/**
	 * Removes a single Index Entry. Be careful only to remove also objects, that are not indexed anymore, so there
	 * won't be orphaned objects left in the storage, that just block space. Ignores already removed indexes.
	 * @abstract
	 * @param {Object} indexEntry The indexEntry to update. Must include the defined IndexEntryIdentifierProperty
	 * @returns Promise A Promise, that resolves, when the entry is not existent anymore.
	 */
	removeIndexEntry(indexEntry) {
	}

	getIndexEntry(indexEntryIdentifier){
	}

	getIndex(){
	}

	/**
	 * Adds an Object to the storage. Must include the defined objectIdentifierProperty
	 * @abstract
	 * @param {Object} object The object to add to the storage
	 * @param {String} collection The collection identifier the object belongs to
	 * @returns Promise A Promise, that resolves, when the object has been added to the storage
	 */
	addObject(object, collection) {
	}

	updateObject(object, collection) {
	}

	removeObject(object, collection) {
	}

	getObject(objectIdentifier, collection) {
	}

	getObjectList(collection){
	}

	getObjectCount(collection){

	}

	nukeStorage(){
	}

}

module.exports = FenrirPersistenceAdapter;