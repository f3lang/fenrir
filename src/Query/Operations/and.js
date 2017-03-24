const AbstractFertileOperation = require('./AbstractFertileOperation');

/**
 * Concats an array of operations with a logical 'AND' operation.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class and extends AbstractFertileOperation {

	/**
	 * @param dataSet
	 * @returns {Array|*}
	 * @private
	 */
	_resolve(dataSet) {
		// We opt out as soon as possible by just using the previously
		// positive tested values for the next query.
		let intermediateResult = dataSet.slice();
		this.childOperations.map(childOperation => intermediateResult = intermediateResult.length > 0 ? childOperation.resolve(intermediateResult) : []);
		return intermediateResult;
	}

}

module.exports = and;