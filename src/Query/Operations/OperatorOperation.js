const AbstractOperation = require('./AbstractOperation');

/**
 * An OperatorOperation is an operation which is like an endpoint
 * of a query. As an option, you pass an operator and its query values.
 *
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class OperatorOperation extends AbstractOperation {

	constructor(collection, operator) {
		super();
		this.collection = collection;
		this.operator = operator;
	}

	_resolve(object) {
		this.operator.query(object);
	}

}

module.exports = OperatorOperation;