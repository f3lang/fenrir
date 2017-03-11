const AbstractDataProvider = require('./AbstractDataProvider');
const DocumentError = require('../Error/DocumentError');

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
		this.data = persistenceAdapter.data;
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
		const Index = require('../Index/' + type + 'Index');
		let idx = new Index(this, path);
		this.addIndex(index);
		this.persistenceAdapter.addIndex(index);
	}

	insertOne(document) {
		if(document['$fenrir'] && this.indexTypeMap.Id.$fenrir.findDocument(document['$fenrir'])) {
			throw new DocumentError('1-002', 'Document has already $fenrirId, that is used in the database', {document});
		}
		document.$fenrir = ;
		this.data().push(document);
	}


}

module.exports = Collection;