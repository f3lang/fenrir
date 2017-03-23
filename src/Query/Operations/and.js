const AbstractFertileOperation = require('./AbstractFertileOperation');

/**
 * Concats an array of operations with a logical 'AND' operation.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class and extends AbstractFertileOperation {

	/**
	 * We opt out as soon as possible by just using the previously
	 * positive tested values for the next query.
	 * @param collection
	 * @param dataSet
	 * @returns {Array|*}
	 * @private
	 */
	_resolve(collection, dataSet) {
		let intermediateResult = dataSet.slice();
		return this.childOperations.map(childOperation => intermediateResult = intermediateResult.length > 0 ? childOperation.resolve(collection, intermediateResult) : []);
	}

}

module.exports = and;