const QuestionableObject = require('../QuestionableObject');

/**
 * The Abstract class for an index. We keep a list of indexes
 * objects available
 */
class AbstractOperator extends QuestionableObject {

	constructor() {
		if(new.target === AbstractOperator) {
			throw new TypeError('Cannot use AbstractOperator directly, please use derived class');
		}
		this.queryCount = 0;
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