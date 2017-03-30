/**
 * The Abstract Index parent class for every Index.
 * It offers the structure for a simple index covering one specific field in an object
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class AbstractIndex {

	constructor(collection, field){
	}

	rebuildIndex(){
	}

	addDocument(object, identifier){
	}

	removeDocument(identifier){
	}

	findDocument(fieldData){
	}

	/**
	 * Retrieves an object including the statistics of this index.
	 * This includes basically two values: The number of writes to this index
	 * and the number of writes of this index. This allows collection
	 * to determine, whether an index should be kept alive or killed and removed
	 * from the collection. This will keep only useful indices alive and wont
	 * overload the persistence layer.
	 */
	getUsageStat(){
	}

	/**
	 * Returns the type of index as a string.
	 */
	getIndexType(){
	}

	/**
	 * Get the data path this index uses in the documents.
	 * @return string The path in the documents this index indices.
	 */
	getIndexPath(){
	}

	/**
	 * Removes this index. This may happen if the collection notices, that the
	 * index isn't used very much. By removing unused indices, you can save storage
	 * and therefore the persistence will work faster.
	 */
	removeIndex(){
	}

	serialize(){
	}

	deserialize(serializedIndex){
	}

}

module.exports = AbstractIndex;