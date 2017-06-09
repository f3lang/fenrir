const AbstractDataProvider = require('./AbstractDataProvider');
const DocumentError = require('../Error/DocumentError');
const ResultSet = require('./ResultSet');
const Query = require('../Query/Query');
const PerformanceManager = require('./PerformanceManager');
const IndexManager = require('./IndexManager');

const STANDARD_INDICES = [
	{type: 'id', field: '$fenrir'}
];

/**
 * The Collection is the base class to handle the data of a database.
 * One database may hold multiple collections
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class Collection extends AbstractDataProvider {

	/**
	 * @param fenrir The database, this collection is associated to
	 * @param persistenceAdapter The persistence adapter responsible for this collection
	 */
	constructor(fenrir, persistenceAdapter) {
		super();
		this.persistenceAdapter = persistenceAdapter;
		this._data = persistenceAdapter.data;
		this.indexSignatureMap = {};
		this.indexTypeMap = {};
		this.indexPathMap = {};
		this.indexMap = [];
		persistenceAdapter.getIndices().forEach(index => this.addIndex(index));
		STANDARD_INDICES.forEach(indexDefinition => {
			if (!this.indexSignatureMap[indexDefinition.type + indexDefinition.path]) {
				this.createIndex(indexDefinition.type, indexDefinition.path);
			}
		});
		this.trackedResultSets = [];
		this.performanceManager = new PerformanceManager(this);
		this.indexManager = new IndexManager(this);
	}

	addIndex(index) {
		let path = index.getIndexPath();
		let type = index.getIndexType();
		this.indexTypeMap[type] = this.indexTypeMap[type] || {};
		this.indexTypeMap[type][path] = index;
		this.indexPathMap[path] = this.indexPathMap[path] || {};
		this.indexPathMap[path][type] = index;
		this.indexSignatureMap[type + path] = index;
		this.indexMap.push(index);
	}

	createIndex(type, path) {
		//TODO extract this logic to the index manager
		const Index = require('../Index/' + type + 'Index');
		let idx = new Index(this, path);
		this.addIndex(index);
		this.persistenceAdapter.addIndex(index);
	}

	insertOne(document) {
		if (document['$fenrir'] && this.indexTypeMap.Id.$fenrir.findDocument(document['$fenrir'])) {
			throw new DocumentError('1-002', 'Document has already $fenrirId, that is used in the database', {document});
		}
		document.$fenrir = this.indexTypeMap.Id.$fenrir.getLastIndex() + 1;
		this._data.push(document);
		this.trackedResultSets[i].forEach(resultSet => resultSet.insertOne(document));
		this.indexManager.addDocument(document);
	}

	find(query, keep = false) {
		let resultSet = new ResultSet(this, this, new Query(query));
		if(keep) {
			this.trackedResultSets.push(resultSet);
		}
		return resultSet;
	}

	data() {
		return this._data.getDataSet();
	}

	getPerformanceManager(){
		return this.performanceManager;
	}

	getPersistenceManager(){
		return this.persistenceAdapter;
	}

}

module.exports = Collection;