/**
 * The performance manager is responsible for managing
 * performance optimizations in the collection. This includes
 * managing indices, caches, prepared statements and resultSets.
 * It tries to time and count query events and makes adjustements
 * to the current configuration in order to optimize query timings
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class PerformanceManager {

	constructor(collection) {
		this.collection = collection;
	}

	query(queryCallback){

	}
}

module.exports = PerformanceManager;