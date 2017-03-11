const AbstractDataProvider = require('./AbstractDataProvider');

/**
 * The ResultSet represents the result of a query on a collection.
 * The Query and the result are cached, so recurring queries can be performed much faster
 *
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class ResultSet extends AbstractDataProvider {

	constructor(dataProvider, query) {
		super();
		this.resultData = {};
		this.resultValid = true;
		this.dataProvider = dataProvider;
		this.query = query;
		this.trackedChildResultSets = [];
	}

	/**
	 * Executes the query on the collection and stores the result in this ResultSet
	 */
	resolveQuery() {
		this.resultData = this.query.run(this.dataProvider);
		this.resultValid = true;
	}

	getQuery() {
		return this.query;
	}

	find(query, keep = false) {
		let resultSet = new ResultSet(this, query);
		if (keep) {
			this.trackedChildResultSets.push(resultSet);
		}
		return resultSet;
	}

	insertOne(document){
		if(this.query.objectMatches(document)) {
			this.data[object['$fenrir']] = document;
			this.trackedChildResultSets.forEach(resultSet => resultSet.insertOne(document));
		}
	}

}

module.exports = ResultSet;