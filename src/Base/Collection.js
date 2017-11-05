const AbstractDataProvider = require('./AbstractDataProvider');
const DocumentError = require('../Error/DocumentError');
const ResultSet = require('./ResultSet');
const Query = require('../Query/Query');
const PerformanceManager = require('./PerformanceManager');
const IndexManager = require('./IndexManager');
const CacheManager = require('./CacheManager');

const STANDARD_INDICES = [
	{type: 'Id', field: '$fenrir'}
];

/**
 * The Collection is the base class to handle the data of a database.
 * One database may hold multiple collections
 *
 * The data is organized in two different fields. On one hand we have
 * the _data field, which holds all the data of the collection.
 * This field is used for the creation of ResultSets and Querying the data
 * The _dataMap field is basically a map from the data index to the actual
 * document inside the _data field. If a document is not available in the _d
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class Collection extends AbstractDataProvider {

	/**
	 * @param fenrir The database, this collection is associated to
	 * @param options The options to init this collection
	 */
	constructor(fenrir, options) {
		super();

		let defaultOptions = {};
		this.fenrir = fenrir;
		this.options = Object.assign(defaultOptions, options);

		this.trackedResultSets = [];
		this.performanceManager = new PerformanceManager(this);
		this.indexManager = new IndexManager(this);
		this.cacheManager = new CacheManager(this);
		this._data = [];
		this._dataMap = {};
	}

	/**
	 * Attaches a persistence adapter to this collection. Pulls the data from the
	 * persistence adapter and retrieves persisted indices from the adapter.
	 * If the persistence adapter has additional info to restore in the collection,
	 * it lies in it's domain to do this.
	 * @param persistenceAdapter The persistence adapter to
	 */
	attachPersistenceAdapter(persistenceAdapter) {
		this.persistenceAdapter = persistenceAdapter;
		this._data = persistenceAdapter.data;

		persistenceAdapter.getIndices().forEach(index => this.addIndex(index));
		STANDARD_INDICES.forEach(indexDefinition => this.indexManager.createIndex(indexDefinition.field, indexDefinition.type));
	}

	/**
	 *
	 * @param documents {array|object}
	 */
	insert(documents) {
		if (Array.isArray(documents)) {
			let i = documents.length;
			while (i--) {
				this.insertOne(documents[i]);
			}
		}
	}

	insertOne(document) {
		if (document['$fenrir'] && this.indexManager.getIndex('$fenrir', 'Id').findDocument(document['$fenrir'])) {
			throw new DocumentError('1-002', 'Document has already $fenrirId, that is used in the database', {document});
		}
		document.$fenrir = this.indexManager.getIndex('$fenrir', 'Id').getLastIndex() + 1;
		this._data[document.$fenrir] = document;
		this.trackedResultSets.forEach(resultSet => resultSet.insertOne(document));
		this.indexManager.addDocument(document);
	}

	find(query, keep = false) {
		let resultSet = new ResultSet(this, this, new Query(query, this));
		if (keep) {
			this.trackedResultSets.push(resultSet);
		}
		return resultSet;
	}

	data() {
		return this._data;
	}

	getPerformanceManager() {
		return this.performanceManager;
	}

	getPersistenceManager() {
		return this.persistenceAdapter;
	}

	getIndexManager() {
		return this.indexManager;
	}

	getCacheManager() {
		return this.cacheManager;
	}


}

module.exports = Collection;