/**
 * The Query class represents a query on a collection including subqueries etc.
 */
class Query {

	/**
	 * @param queryDefinition The definition of the query itself
	 */
	constructor(queryDefinition){
		this.queryDefinition = queryDefinition;
	}

	/**
	 * Returns the signature including the query values of this query as a string.
	 * By using this signature, we can build up a query cache to deliver faster
	 * results for recurring queries.
	 */
	getSignature(){
	}

	/**
	 * Returns a string signature of the query which is only based on the structure of the query.
	 * By this, we can optimize and keep track of the usage of indices. e.g. If we notice,
	 * that the field "name" is queried quite often, we can automatically create an index
	 * over this field to speed things up. On the other end we can remove indices, that
	 * are abandoned and not used.
	 */
	getStructureSignature(){
	}

	/**
	 * Runs this query on the given collection and returns the result wrapped in a Promise
	 * @param collection The collection to run the query on
	 */
	run(collection){
	}


	/**
	 * Checks, whether an object matches this query. This function is used by the caching process to
	 * associate new or modified objects to existing ResultSets.
	 * @param object The object to check
	 * @return boolean True, if the object matches this query
	 */
	objectMatches(object){
	}

}

module.exports = Query;