const QuestionableObject = require('../QuestionableObject');

/**
 * The Abstract class for an operator.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class AbstractOperator extends QuestionableObject {

	constructor(query, valueIndex) {
		super();
		if (new.target === AbstractOperator) {
			throw new TypeError('Cannot use AbstractOperator directly, please use derived class');
		}
		this.query = query;
		this.valueIndex = valueIndex;
		//The accessorCache caches precompiled object accessors, so they don't need to be recompiled every time
		this.accessorCache = {};
	}

	/**
	 * Returns a groupIdentifier to group multiple created operators together.
	 * By counting the queries for one group, the collection can decide to
	 * create a new index over frequently used fields.
	 */
	getGroupIdentifier() {
	}

	/**
	 *
	 * @param index
	 */
	setIndex(index) {
	}

	removeIndex() {
	}

	/**
	 * Applies this operator on the given dataSet
	 * @param dataSet
	 */
	applyOn(dataSet) {
		return dataSet.length > 0 ? this._applyOn(dataSet) : [];
	}

	/**
	 * This method is internally called by the operator and performs the action.
	 * @param dataSet
	 * @returns {*}
	 * @private
	 */
	_applyOn(dataSet) {
		return dataSet;
	}

	/**
	 * Returns the index name, this operator needs.
	 * e.g. the eq operator would work with the BTreeIndex
	 */
	getDemandedIndex() {
	}

	serialize() {

	}

	deserialize() {

	}

}

module.exports = AbstractOperator;