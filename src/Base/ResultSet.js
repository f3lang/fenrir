/**
 * The ResultSet represents the result of a query on a collection.
 * The Query and the result are cached, so recurring queries can be performed much faster
 *
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class ResultSet {

	constructor(collection, query){
		this.resultData = {};
		this.resultValid = true;
		this.collection = collection;
		this.query = query;
	}

	/**
	 * Executes the query on the collection and stores the result in this ResultSet
	 */
	resolveQuery(){
		this.resultData = this.query.run(this.collection);
		this.resultValid = true;
	}

	getQuery(){
		return this.query;
	}



}

module.exports = ResultSet;