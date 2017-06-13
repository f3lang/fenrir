const AbstractOperator = require('./AbstractOperator');
const ObjectHelper = require('../../Helper/ObjectHelper');

/**
 * Operator to compare exactly values from the database against a value.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class eq extends AbstractOperator {

	_applyOn(dataSet) {
		let path = Object.keys(this.query.operatorDataStorage[this.valueIndex])[0];
		let val = this.query.operatorDataStorage[this.valueIndex][path];
		console.log("index in operator:", this.index);
		if(this.index && !this.index.isDirty()) {
			return this.index.findDocument(val).map($fenrir => dataSet[$fenrir]);
		}
		//so now we don't have a valid or clean index and we need to find the data manually
		let acc = this.accessorCache[path];
		if (!acc) {
			acc = ObjectHelper.getCompiledObjectAccessor(path);
			this.accessorCache[path] = acc;
		}
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

	getDemandedIndex(){
		return 'BTree';
	}

}

module.exports = eq;