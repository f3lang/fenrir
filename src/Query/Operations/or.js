const AbstractFertileOperation = require('./AbstractFertileOperation');
/**
 * Concats an array of operations with a logical 'OR' operation.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class or extends AbstractFertileOperation {

	_resolve(dataSet) {
		let initialDataSet = dataSet.slice();
		let result = [];
		this.childOperations.map(childOperation => {
			childOperation.resolve(initialDataSet);
		});
	}

}

module.exports = or;