const AbstractDataProvider = require('./AbstractDataProvider');
const Query = require('../Query/Query');

/**
 * The ResultSet represents the result of a query on a collection.
 * The Query and the result are cached, so recurring queries can be performed much faster.
 * The collection is patched through to all layers, because the collection houses all
 * the indexing and cache logic.
 *
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class ResultSet extends AbstractDataProvider {

	constructor(collection, dataProvider, query) {
		super();
		this.resultData = [];
		this.resultValid = true;
		this.collection = collection;
		this.dataProvider = dataProvider;
		this.query = query;
		this.trackedChildResultSets = [];
		this._data = [];
		this.resolveQuery();
	}

	/**
	 * Executes the query on the collection and stores the result in this ResultSet
	 */
	resolveQuery() {
		this.resultData = this.query.run(this.collection, this.dataProvider.data());
		this.resultValid = true;
	}

	getQuery() {
		return this.query;
	}

	find(query, keep = false) {
		let resultSet = new ResultSet(this.collection, this, new Query(query, this.collection));
		if (keep) {
			this.trackedChildResultSets.push(resultSet);
		}
		return resultSet;
	}

	insertOne(document) {
		if(this.query.objectMatches(document)) {
			this._data[document['$fenrir']] = document;
			this.trackedChildResultSets.forEach(resultSet => resultSet.insertOne(document));
		}
	}

	data(){
		return this.resultValid ? this.resultData : this.query.run(this.collection, this.dataProvider.data());
	}

}

module.exports = ResultSet;