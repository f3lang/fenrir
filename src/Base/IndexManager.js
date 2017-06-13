/**
 * The index manager manages indices. whoaa..
 * All jokes aside. All Operators, that make use of indices
 * will search for existing indices in an instance of this class.
 * Each collection has it's own index manager.
 *
 * Furthermore, the collection or the performance manager may
 * create new indices by requesting them from this class
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class IndexManager {

	constructor(collection) {
		this.collection = collection;
		this.performanceManager = collection.getPerformanceManager();
		this.persistenceManager = collection.getPersistenceManager();
		this.indexPathMap = {};
		this.indexCollection = [];
	}

	/**
	 * Returns an index for the requested path and type. Returns null, if there is no index present
	 * @param path The path in the documents to use
	 * @param type The requested index type
	 */
	getIndex(path, type) {
		console.log('Index request:', path, type);
		this.performanceManager.recordIndexRequestAction(path, type);
		return this.indexPathMap[path] && this.indexPathMap[path][type] ? this.indexPathMap[path][type] : null;
	}

	createIndex(path, type) {
		const Index = require('../Index/' + type + 'Index');
		let idx = new Index(this.collection, path);
		this.addIndex(idx);
	}

	nukeIndex(path, type){
		let index = this.indexPathMap[path][type];
		this.removeIndex(index);
		index.nuke();
	}

	nukeIndicesByPath(path){

	}

	/**
	 * Adds an index to the internal index management system.
	 * @param index The index to track
	 */
	addIndex(index) {
		let path = index.getIndexPath();
		let type = index.getIndexType();
		this.indexPathMap[path] = this.indexPathMap[path] || {};
		this.indexPathMap[path][type] = index;
		this.indexCollection.push(index);
	}

	removeIndex(index){
		let path = index.getIndexPath();
		let type = index.getIndexType();
		delete this.indexPathMap[path][type];
	}

	addDocument(document) {
		let i = this.indexCollection.length;
		while(i--) {
			this.indexCollection[i].addDocument(document);
		}
	}

}

module.exports = IndexManager;