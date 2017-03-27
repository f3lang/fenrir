/**
 * The CacheManager keeps track of various cache entries for collections:
 * - object accessor cache
 * - query cache
 * @author Wolfgang Felbermeier
 */
class CacheManager {

	constructor(collection) {
		this.collection = collection;
		this.objectAccessorCache = {};
	}

}