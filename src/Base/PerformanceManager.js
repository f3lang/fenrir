/**
 * The performance manager is responsible for managing
 * performance optimizations in the collection. This includes
 * managing indices, caches, prepared statements and resultSets.
 * It tries to time and count query events and makes adjustments
 * to the current configuration in order to optimize query timings.
 *
 *
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class PerformanceManager {

	constructor(collection) {
		this.collection = collection;
		// The indexCounter is a map of all requested indices and increased by 1 each time
		// the index is requested. It is flushed periodically so we can measure the need for
		// an index in a certain time. With this information the performance manager can decide
		// whether to create a new index or not
		this.indexCounter = {};
		// The long index counter is used to capture all index access over a long time.
		// Watching this values, the performanceManager may remove unused indices from the collection,
		// since an index overhead slows down the database.
		this.longIndexCounter = {};
		this.index
		this.indexFlushTimer = setInterval(this.optimizeIndexes, 10000);
	}

	query(queryCallback) {

	}

	recordIndexRequestAction(path, type) {
		this.indexCounter[path+type] = this.indexCounter[path+type] ? this.indexCounter[path+type] + 1 : 1;
		this.longIndexCounter[path+type] = this.longIndexCounter[path+type] ? this.longIndexCounter[path+type] + 1 : 1;
	}

	optimizeIndexes() {
		let keys
	}
}

module.exports = PerformanceManager;