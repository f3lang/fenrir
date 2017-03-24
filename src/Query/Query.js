const OperatorOperation = require('./Operations/OperatorOperation');

/**
 * The Query class represents a query on a collection including subqueries etc.
 *
 * A query always has an entry point in it's definition. This entry point is represented
 * in an instance of Query by the rootOperation Object. This Object is called first on
 * checking, whether an object may pass through this query or not.
 *
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class Query {

	/**
	 * @param queryDefinition The definition of the query itself
	 * @param collection
	 */
	constructor(queryDefinition, collection) {
		this.queryDefinition = queryDefinition;
		this.collection = collection;

		// Those three fields store the data for the operators to compare against
		// The pointerMap holds a reference to the data by the path in the query.
		// The operatorDataStorage holds the data in an array to give the operators
		// fast access to the data. The operators only hold the index of the data
		// in the operatorDataStorage.
		// The pointerDataMap hold the information, which entry in the pointerMap
		// is referenced by which index in the operatorDataStorage
		this.pointerMap = {};
		this.operatorDataStorage = [];
		this.pointerDataMap = {};

		this.rootOperation = this.compileQueryDefinition(queryDefinition, '');
	}

	/**
	 * Compiles a query definition to a resolvable chain of operations
	 * @param queryDefinition
	 * @param path
	 * @return {AbstractOperation} An instance of an AbstractOperation
	 */
	compileQueryDefinition(queryDefinition, path) {
		return Object.keys(queryDefinition).map(key => {
			let operationDefinition = queryDefinition[key];
			if (Array.isArray(operationDefinition)) {
				let OPERATION = require('./Operations/' + key);
				return new OPERATION(this.collection, operationDefinition.map(definition => this.compileQueryDefinition(definition, path+'/'+key)));
			} else {
				let pathSegment = key + '/' +Object.keys(operationDefinition)[0];
				let OPERATOR = require('./Operators/' + key);
				this.pointerMap[path + '/' + pathSegment] = operationDefinition;
				let index = this.operatorDataStorage.push(this.pointerMap[path + '/' + pathSegment]) - 1;
				this.pointerDataMap[path + '/' + pathSegment] = index;
				let operator = new OPERATOR(this, index);
				// since only operator operations have an object as a child,
				// we can assume, that we have an operator operation at
				// this point of the query definition
				return new OperatorOperation(this.collection, operator);
			}
		})[0];
	}

	/**
	 * Returns the signature including the query values of this query as a string.
	 * By using this signature, we can build up a query cache to deliver faster
	 * results for recurring queries.
	 */
	getSignature() {
	}

	/**
	 * Returns a string signature of the query which is only based on the structure of the query.
	 * By this, we can optimize and keep track of the usage of indices. e.g. If we notice,
	 * that the field "name" is queried quite often, we can automatically create an index
	 * over this field to speed things up. On the other end we can remove indices, that
	 * are abandoned and not used.
	 */
	getStructureSignature() {
	}

	/**
	 * Runs this query on the given collection and returns the result wrapped in a Promise
	 * @param collection {Collection} The collection to run the query on
	 * @param dataSet {Array} The data to execute the query on.
	 */
	run(collection, dataSet) {
		return this.rootOperation.resolve(dataSet);
	}


	/**
	 * Checks, whether a single object matches this query. This function is used by the caching process to
	 * associate new or modified objects to existing ResultSets.
	 * @param object The object to check
	 * @return boolean True, if the object matches this query
	 */
	objectMatches(object) {
		return this.rootOperation.resolve([object]).length > 0;
	}

	/**
	 * Returns a map of all query data objects used in this query. This offers a way to reuse this query
	 * instance with different values for the operators.
	 */
	getPointerMap() {
		return this.pointerMap;
	}

	/**
	 * Creates a copy of this query with different values for the operators.
	 * This only works for maps that are based on a query with the same structural signature.
	 * Normally u will use this for fairly complex queries, where the creation of a new query
	 * would take a bit more time.
	 * @param map
	 * @return A new query instance with the map applied
	 */
	fork(map) {
		let fork = Object.assign(Object.create(this), this);
		fork.pointerMap = Object.assign({}, fork.pointerMap);
		fork.operatorDataStorage = Array.slice(fork.operatorDataStorage);
		Object.keys(map).map(key => {
			fork.pointerMap[key] = map[key];
			fork.operatorDataStorage[fork.pointerDataMap[key]] = fork.pointerMap[key];
		});
		return fork;
	}

}

module.exports = Query;