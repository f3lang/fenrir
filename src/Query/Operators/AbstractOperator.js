const QuestionableObject = require('../QuestionableObject');

/**
 * The Abstract class for an operator. We keep a list of indexes
 * objects available
 */
class AbstractOperator extends QuestionableObject {

	constructor(value) {
		if(new.target === AbstractOperator) {
			throw new TypeError('Cannot use AbstractOperator directly, please use derived class');
		}
		this.queryCount = 0;
	}

	/**
	 * Returns a groupIdentifier to group multiple created operators together.
	 * By counting the queries for one group, the collection can decide to
	 * create a new index over frequently used fields.
	 */
	getGroupIdentifier(){
	}

	/**
	 *
	 * @param index
	 */
	setIndex(index){
	}

	removeIndex(){
	}

	/**
	 * Queries the Operator
	 * @param field
	 * @param value
	 * @param index
	 */
	query(field, value, index = null) {
	}

	/**
	 * Returns the index name, this operator needs.
	 * e.g. the eq operator would work with the BTreeIndex
	 */
	getDemandedIndex(){
	}

	serialize(){

	}

	deserialize(){

	}

}