/**
 * An Operation defines a connection between
 * one or many sub operations or operators.
 * e.g.: {'or': [{'eq': {name: 'Mustermann'}}, {'eq': {name: 'Max'}}]}
 * This includes 3 operations:
 * 1. one 'or' operation to concat the array of sub operations
 * 2. two 'eq' operations, that use the operator 'eq' to compare the values to existing ones.
 *
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class AbstractOperation {

	constructor(collection) {
		this.collection = collection;
	}

	/**
	 * resolve() is the public function to call. It performs arbitrary
	 * checks on the dataSet to ensure a fast exit from the function,
	 * if there is no need to calculate the data (e.g. the dataSet is empty).
	 * @param collection
	 * @param dataSet
	 */
	resolve(dataSet){
		return dataSet.length > 0 ? this._resolve(dataSet) : [];
	}

	/**
	 * This is the function implemented by derived classes.
	 * @param collection
	 * @param dataSet
	 */
	_resolve(dataSet) {
	}

}

module.exports = AbstractOperation;