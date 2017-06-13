const ObjectHelper = require('../Helper/ObjectHelper');

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
		this.queryCache = {};
		this.queryStructureCache = {};
	}

	/**
	 * Caches a query for reuse either directly or as a prepared statement
	 * @param {Query} query The Query
	 */
	cacheQuery(query){
		this.queryCache[query.getSignature()] = query;
		this.queryStructureCache[query.getStructureSignature()] = query;
	}

	/**
	 * Will cache an objectAccessor for a collection. Will override
	 * existing objectAccessors for the propertyPath
	 * @param {String} propertyPath The propertyPath, the accessor works on
	 * @param accessor The accessor itself
	 */
	cacheObjectAccessor(propertyPath, accessor){
		this.objectAccessorCache[propertyPath] = accessor;
	}

	/**
	 * If a suitable object accessor is already cached for the collection,
	 * this will return it. If no accessor is cached, this will be created.
	 * @param propertyPath The propertypath for the objectAccessor
	 */
	getObjectAccessor(propertyPath) {
		if(!this.objectAccessorCache[propertyPath]) {
			this.objectAccessorCache[propertyPath] = ObjectHelper.getCompiledObjectAccessor(propertyPath);
		}
		return this.objectAccessorCache[propertyPath];
	}
}

module.exports = CacheManager;