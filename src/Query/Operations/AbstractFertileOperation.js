const AbstractOperation = require('./AbstractOperation');

/**
 * An AbstractFertileOperation is a form of operation that can hold multiple
 * child operations and form certain connections between them
 */
class AbstractFertileOperation extends AbstractOperation {

	constructor(collection, childOperations) {
		super(collection);
		this.childOperations = childOperations;
	}

}

module.exports = AbstractFertileOperation;