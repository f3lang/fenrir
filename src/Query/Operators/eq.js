const AbstractOperator = require('./AbstractOperator');
const ObjectHelper = require('../../Helper/ObjectHelper');

/**
 * Operator to compare exactly values from the database against a value.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class eq extends AbstractOperator {

	_applyOn(dataSet) {
		let path = Object.keys(this.query.operatorDataStorage[this.valueIndex])[0];
		let acc = this.accessorCache[path];
		if (!acc) {
			acc = ObjectHelper.getCompiledObjectAccessor(path);
			this.accessorCache[path] = acc;
		}
		let val = this.query.operatorDataStorage[this.valueIndex][path];
		// Always use the while-- loop. This is really really quick.
		// for-loop is about 2,5% slower. .map or .forEach are no match for both of them.
		let result = [];
		let i = dataSet.length;
		while(i--) {
			if(acc(dataSet[i]) === val) {
				result.push(dataSet[i]);
			}
		}
		return result;
	}

}

module.exports = eq;