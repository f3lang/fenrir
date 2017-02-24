const FenrirEventEmitter = require('./../FenrirEventEmitter');
const UniqueIndex = require('./../UniqueIndex');
const ExactIndex = require('./../ExactIndex');
const Helper = require('./../Helper');
const Utils = require('./../Utils');
const DynamicView = require('./../DynamicView');
const Resultset = require('./../Resultset');

class Collection extends FenrirEventEmitter {

	/**
	 * Collection class that handles documents of same type
	 * @constructor Collection
	 * @extends FenrirEventEmitter
	 * @param {string} name - collection name
	 * @param {(array|object)=} options - (optional) array of property names to be indicized OR a configuration object
	 * @param {string} options.persistenceAdapter The persistence adapter to use
	 * @param {array} options.unique - array of property names to define unique constraints for
	 * @param {array} options.exact - array of property names to define exact constraints for
	 * @param {array} options.indices - array property names to define binary indexes for
	 * @param {boolean} options.adaptiveBinaryIndices - collection indices will be actively rebuilt rather than lazily (default: true)
	 * @param {boolean} options.asyncListeners - default is false
	 * @param {boolean} options.disableChangesApi - default is true
	 * @param {boolean} options.transactional - default is true
	 * @param {boolean} options.autoupdate - use Object.observe to update objects automatically (default: false)
	 * @param {boolean} options.clone - specify whether inserts and queries clone to/from user
	 * @param {string} options.cloneMethod - 'parse-stringify' (default), 'jquery-extend-deep', 'shallow'
	 * @param {int} options.ttl - time interval for clearing out 'aged' documents; not set by default.
	 * @param {int} options.ttlInterval - time interval for clearing out 'aged' documents; not set by default.
	 * @see {@link Fenrir#addCollection} for normal creation of collections
	 */
	constructor(name, options) {
		super();
		this.console = {
			log: () => {
			},
			warn: () => {
			},
			error: () => {
			}
		};
		// the name of the collection
		this.name = name;
		// the data held by the collection
		this.data = [];
		this.idIndex = []; // index of id
		this.binaryIndices = {}; // user defined indexes
		this.constraints = {
			unique: {},
			exact: {}
		};

		// unique constraints contain duplicate object references, so they are not persisted.
		// we will keep track of properties which have unique constraint applied here, and regenerate on load
		this.uniqueNames = [];

		// transforms will be used to store frequently used query chains as a series of steps
		// which itself can be stored along with the database.
		this.transforms = {};

		// the object type of the collection
		this.objType = name;

		// in autosave scenarios we will use collection level dirty flags to determine whether save is needed.
		// currently, if any collection is dirty we will autosave the whole database if autosave is configured.
		// defaulting to true since this is called from addCollection and adding a collection should trigger save
		this.dirty = true;

		// private holders for cached data
		this.cachedIndex = null;
		this.cachedBinaryIndex = null;
		this.cachedData = null;

		/* OPTIONS */
		options = options || {};

		// exact match and unique constraints
		if (options.hasOwnProperty('unique')) {
			if (!Array.isArray(options.unique)) {
				//noinspection JSValidateTypes
				options.unique = [options.unique];
			}
			options.unique.forEach(function (prop) {
				this.uniqueNames.push(prop); // used to regenerate on subsequent database loads
				this.constraints.unique[prop] = new UniqueIndex(prop);
			});
		}

		if (options.hasOwnProperty('exact')) {
			options.exact.forEach(function (prop) {
				this.constraints.exact[prop] = new ExactIndex(prop);
			});
		}

		// if set to true we will optimally keep indices 'fresh' during insert/update/remove ops (never dirty/never needs rebuild)
		// if you frequently intersperse insert/update/remove ops between find ops this will likely be significantly faster option.
		this.adaptiveBinaryIndices = options.hasOwnProperty('adaptiveBinaryIndices') ? options.adaptiveBinaryIndices : true;
		// is collection transactional
		this.transactional = options.hasOwnProperty('transactional') ? options.transactional : false;
		// options to clone objects when inserting them
		this.cloneObjects = options.hasOwnProperty('clone') ? options.clone : false;
		// default clone method (if enabled) is parse-stringify
		this.cloneMethod = options.hasOwnProperty('cloneMethod') ? options.cloneMethod : "parse-stringify";
		// option to make event listeners async, default is sync
		this.asyncListeners = options.hasOwnProperty('asyncListeners') ? options.asyncListeners : false;
		// disable track changes
		this.disableChangesApi = options.hasOwnProperty('disableChangesApi') ? options.disableChangesApi : true;
		//Set correct changes handlers according to the disableChangesApi flag
		this.setHandlers();
		// option to observe objects and update them automatically, ignored if Object.observe is not supported
		this.autoupdate = options.hasOwnProperty('autoupdate') ? options.autoupdate : false;
		//option to activate a cleaner daemon - clears "aged" documents at set intervals.
		this.ttl = {
			age: null,
			ttlInterval: null,
			daemon: null
		};
		this.setTTL(options.ttl || -1, options.ttlInterval);
		// currentMaxId - change manually at your own peril!
		this.maxId = 0;
		this.DynamicViews = [];
		// events
		this.events = {
			'insert': [],
			'update': [],
			'pre-insert': [],
			'pre-update': [],
			'close': [],
			'flushbuffer': [],
			'error': [],
			'delete': [],
			'warning': []
		};
		// changes are tracked by collection and aggregated by the db
		this.changes = [];

		// initialize the id index
		this.ensureId();
		let indices = [];
		// initialize optional user-supplied indices array ['age', 'lname', 'zip']
		if (options && options.indices) {
			if (Object.prototype.toString.call(options.indices) === '[object Array]') {
				indices = options.indices;
			} else if (typeof options.indices === 'string') {
				indices = [options.indices];
			} else {
				throw new TypeError('Indices needs to be a string or an array of strings');
			}
		}
		for (let idx = 0; idx < indices.length; idx++) {
			this.ensureIndex(indices[idx], false);
		}

		/**
		 * built-in events
		 */
		this.on('insert', this.insertHandler);
		this.on('update', this.updateHandler);
		this.on('delete', (obj) => {
			if (!this.disableChangesApi) {
				this.createChange(self.name, 'R', obj);
			}
		});
		this.on('warning', this.console.warn);

		/**
		 * stages: a map of uniquely identified 'stages', which hold copies of objects to be
		 * manipulated without affecting the data in the original collection
		 */
		this.stages = {};
		//a collection of objects recording the changes applied through a commmitStage
		this.commitLog = [];

		// for de-serialization purposes
		this.flushChanges();
	}

	/**
	 * Deletes all data of this collection and nukes all data in the persistent storage.
	 */
	nuke(){
		//TODO
	}

	createChange(name, op, obj) {
		this.changes.push({
			name: name,
			operation: op,
			obj: JSON.parse(JSON.stringify(obj))
		});
	}

	/**
	 * Clear all changes
	 */
	flushChanges() {
		this.changes = [];
	}

	getChanges() {
		return this.changes;
	}

	/**
	 * If the changes API is disabled make sure only metadata is added without re-evaluating everytime if the changesApi is enabled
	 */
	insertMeta(obj) {
		if (!obj) {
			return;
		}
		if (!obj.meta) {
			obj.meta = {};
		}
		obj.meta.created = (new Date()).getTime();
		obj.meta.revision = 0;
	}

	updateMeta(obj) {
		if (!obj) {
			return;
		}
		obj.meta.updated = (new Date()).getTime();
		obj.meta.revision += 1;
	}

	createInsertChange(obj) {
		this.createChange(this.name, 'I', obj);
	}

	createUpdateChange(obj) {
		this.createChange(this.name, 'U', obj);
	}

	insertMetaWithChange(obj) {
		this.insertMeta(obj);
		this.createInsertChange(obj);
	}

	updateMetaWithChange(obj) {
		this.updateMeta(obj);
		this.createUpdateChange(obj);
	}

	/* assign correct handler based on ChangesAPI flag */
	setHandlers() {
		this.insertHandler = this.disableChangesApi ? this.insertMeta : this.insertMetaWithChange;
		this.updateHandler = this.disableChangesApi ? this.updateMeta : this.updateMetaWithChange;
	}

	setChangesApi(enabled) {
		this.disableChangesApi = !enabled;
		this.setHandlers();
	}

	observerCallback(changes) {
		let changedObjects = typeof Set === 'function' ? new Set() : [];
		if (!changedObjects.add) {
			changedObjects.add = function (object) {
				if (this.indexOf(object) === -1)
					this.push(object);
				return this;
			};
		}
		changes.forEach(function (change) {
			changedObjects.add(change.object);
		});
		changedObjects.forEach(function (object) {
			if (!hasOwnProperty.call(object, '$loki')) {
				return this.removeAutoUpdateObserver(object);
			}
			try {
				this.update(object);
			} catch (err) {
			}
		});
	}

	addAutoUpdateObserver(object) {
		if (!this.autoupdate || typeof Object.observe !== 'function')
			return;

		Object.observe(object, this.observerCallback, ['add', 'update', 'delete', 'reconfigure', 'setPrototype']);
	}

	removeAutoUpdateObserver(object) {
		if (!this.autoupdate || typeof Object.observe !== 'function') {
			return;
		}

		Object.unobserve(object, this.observerCallback);
	}

	/**
	 * Adds a named collection transform to the collection
	 * @param {string} name - name to associate with transform
	 * @param {array} transform - an array of transformation 'step' objects to save into the collection
	 */
	addTransform(name, transform) {
		if (this.transforms.hasOwnProperty(name)) {
			throw new Error("a transform by that name already exists");
		}

		this.transforms[name] = transform;
	}

	/**
	 * Updates a named collection transform to the collection
	 * @param {string} name - name to associate with transform
	 * @param {object} transform - a transformation object to save into collection
	 */
	setTransform(name, transform) {
		this.transforms[name] = transform;
	}

	/**
	 * Removes a named collection transform from the collection
	 * @param {string} name - name of collection transform to remove
	 */
	removeTransform(name) {
		delete this.transforms[name];
	}

	byExample(template) {
		let k;
		let obj;
		let query = [];
		for (k in template) {
			if (!template.hasOwnProperty(k)) {
				continue;
			}
			obj = {};
			obj[k] = template[k];
			query.push(obj);
		}
		return {
			'$and': query
		};
	}

	findObject(template) {
		return this.findOne(this.byExample(template));
	};

	findObjects(template) {
		return this.find(this.byExample(template));
	}

	/*----------------------------+
	 | TTL daemon                  |
	 +----------------------------*/
	ttlDaemonFuncGen() {
		let collection = this;
		let age = this.ttl.age;
		return function ttlDaemon() {
			let now = Date.now();
			let toRemove = collection.chain().where(function daemonFilter(member) {
				let timestamp = member.meta.updated || member.meta.created;
				let diff = now - timestamp;
				return age < diff;
			});
			toRemove.remove();
		};
	}

	setTTL(age, interval) {
		if (age < 0) {
			clearInterval(this.ttl.daemon);
		} else {
			this.ttl.age = age;
			this.ttl.ttlInterval = interval;
			this.ttl.daemon = setInterval(this.ttlDaemonFuncGen(), interval);
		}
	}

	/*----------------------------+
	 | INDEXING                    |
	 +----------------------------*/

	/**
	 * create a row filter that covers all documents in the collection
	 */
	prepareFullDocIndex() {
		let len = this.data.length;
		let indexes = new Array(len);
		while (len--) {
			indexes[len] = len;
		}
		return indexes;
	}

	/**
	 * Will allow reconfiguring certain collection options.
	 * @param {boolean} options.adaptiveBinaryIndices - collection indices will be actively rebuilt rather than lazily
	 */
	configureOptions(options) {
		options = options || {};

		if (options.hasOwnProperty('adaptiveBinaryIndices')) {
			this.adaptiveBinaryIndices = options.adaptiveBinaryIndices;

			// if switching to adaptive binary indices, make sure none are 'dirty'
			if (this.adaptiveBinaryIndices) {
				this.ensureAllIndexes();
			}
		}
	}

	/**
	 * Ensure binary index on a certain field
	 * @param {string} property - name of property to create binary index on
	 * @param {boolean} force - (Optional) flag indicating whether to construct index immediately
	 */
	ensureIndex(property, force) {
		// optional parameter to force rebuild whether flagged as dirty or not
		if (typeof (force) === 'undefined') {
			force = false;
		}
		if (property === null || property === undefined) {
			throw new Error('Attempting to set index without an associated property');
		}
		if (this.binaryIndices[property] && !force) {
			if (!this.binaryIndices[property].dirty) return;
		}
		let index = {
			'name': property,
			'dirty': true,
			'values': this.prepareFullDocIndex()
		};
		this.binaryIndices[property] = index;
		let wrappedComparer =
			(function (p, data) {
				return function (a, b) {
					let objAp = data[a][p],
						objBp = data[b][p];
					if (objAp !== objBp) {
						if (Helper.ltHelper(objAp, objBp, false)) return -1;
						if (Helper.gtHelper(objAp, objBp, false)) return 1;
					}
					return 0;
				};
			})(property, this.data);

		index.values.sort(wrappedComparer);
		index.dirty = false;

		this.dirty = true; // for autosave scenarios
	}

	getSequencedIndexValues(property) {
		let idxvals = this.binaryIndices[property].values;
		let result = "";
		let idx = idxvals.length;
		while (idx--) {
			result += " [" + idx + "] " + this.data[idxvals[idx]][property];
		}
		return result;
	}

	ensureUniqueIndex(field) {
		let index = this.constraints.unique[field];
		if (!index) {
			// keep track of new unique index for regenerate after database (re)load.
			if (this.uniqueNames.indexOf(field) == -1) {
				this.uniqueNames.push(field);
			}
		}
		// if index already existed, (re)loading it will likely cause collisions, rebuild always
		this.constraints.unique[field] = index = new UniqueIndex(field);
		this.data.forEach(function (obj) {
			index.set(obj);
		});
		return index;
	}

	/**
	 * Ensure all binary indices
	 */
	ensureAllIndexes(force) {
		let bIndices = this.binaryIndices;
		for (let key in bIndices) {
			if (hasOwnProperty.call(bIndices, key)) {
				this.ensureIndex(key, force);
			}
		}
	}

	flagBinaryIndexesDirty() {
		let bIndices = this.binaryIndices;
		for (let key in bIndices) {
			if (hasOwnProperty.call(bIndices, key)) {
				bIndices[key].dirty = true;
			}
		}
	}

	flagBinaryIndexDirty(index) {
		if (this.binaryIndices[index]) {
			this.binaryIndices[index].dirty = true;
		}
	}

	/**
	 * Quickly determine number of documents in collection (or query)
	 * @param {object} query - (optional) query object to count results of
	 * @returns {number} number of documents in the collection
	 */
	count(query) {
		if (!query) {
			return this.data.length;
		}
		return this.chain().find(query).filteredrows.length;
	}

	/**
	 * Rebuild idIndex
	 */
	ensureId() {
		let len = this.data.length;
		this.idIndex = [];
		while (len--) {
			this.idIndex.push(this.data[i].$loki);
		}
	}

	/**
	 * Rebuild idIndex async with callback - useful for background syncing with a remote server
	 */
	ensureIdAsync(callback) {
		this.async(() => this.ensureId(), callback);
	}

	/**
	 * Add a dynamic view to the collection
	 * @param {string} name - name of dynamic view to add
	 * @param {object} options - (optional) options to configure dynamic view with
	 * @param {boolean} options.persistent - indicates if view is to main internal results array in 'resultdata'
	 * @param {string} options.sortPriority - 'passive' (sorts performed on call to data) or 'active' (after updates)
	 * @param {number} options.minRebuildInterval - minimum rebuild interval (need clarification to docs here)
	 * @returns {DynamicView} reference to the dynamic view added
	 **/
	addDynamicView(name, options) {
		let dv = new DynamicView(this, name, options);
		this.DynamicViews.push(dv);
		return dv;
	}

	/**
	 * Remove a dynamic view from the collection
	 * @param {string} name - name of dynamic view to remove
	 **/
	removeDynamicView(name) {
		let idx = this.DynamicViews.length;
		while (idx--) {
			if (this.DynamicViews[idx].name === name) {
				this.DynamicViews.splice(idx, 1);
			}
		}
	}

	/**
	 * Look up dynamic view reference from within the collection
	 * @param {string} name - name of dynamic view to retrieve reference of
	 * @returns {DynamicView} A reference to the dynamic view with that name
	 **/
	getDynamicView(name) {
		let idx = this.DynamicViews.length;
		while (idx--) {
			if (this.DynamicViews[idx].name === name) {
				return this.DynamicViews[idx];
			}
		}
		return null;
	}

	/**
	 * Applies a 'mongo-like' find query object and passes all results to an update function.
	 * For filter function querying you should migrate to [updateWhere()]{@link Collection#updateWhere}.
	 *
	 * @param {object|function} filterObject - 'mongo-like' query object (or deprecated filterFunction mode)
	 * @param {function} updateFunction - update function to run against filtered documents
	 */
	findAndUpdate(filterObject, updateFunction) {
		if (typeof (filterObject) === "function") {
			this.updateWhere(filterObject, updateFunction);
		} else {
			this.chain().find(filterObject).update(updateFunction);
		}
	}

	/**
	 * Applies a 'mongo-like' find query object removes all documents which match that filter.
	 *
	 * @param {object} filterObject - 'mongo-like' query object
	 */
	findAndRemove(filterObject) {
		this.chain().find(filterObject).remove();
	}

	/**
	 * Adds object(s) to collection, ensure object(s) have meta properties, clone it if necessary, etc.
	 * @param {(object|Array)} doc - the document (or array of documents) to be inserted
	 * @returns {(object|array)} document or documents inserted
	 */
	insert(doc) {
		if (!Array.isArray(doc)) {
			return this.insertOne(doc);
		}
		// holder to the clone of the object inserted if collections is set to clone objects
		let obj;
		let results = [];
		this.emit('pre-insert', doc);
		let i = doc.length;
		while (i--) {
			obj = this.insertOne(doc[i], true);
			if (!obj) {
				return undefined;
			}
			results.push(obj);
		}
		this.emit('insert', doc);
		return results.length === 1 ? results[0] : results;
	}

	/**
	 * Adds a single object, ensures it has meta properties, clone it if necessary, etc.
	 * @param {object} doc - the document to be inserted
	 * @param {boolean} bulkInsert - quiet pre-insert and insert event emits
	 * @returns {object} document or 'undefined' if there was a problem inserting it
	 */
	insertOne(doc, bulkInsert = false) {
		let err = null;
		let returnObj;
		if (typeof doc !== 'object') {
			err = new TypeError('Document needs to be an object');
		} else if (doc === null) {
			err = new TypeError('Object cannot be null');
		}
		if (err !== null) {
			this.emit('error', err);
			throw err;
		}
		// if configured to clone, do so now... otherwise just use same obj reference
		let obj = this.cloneObjects ? Helper.clone(doc, this.cloneMethod) : doc;
		if (typeof obj.meta === 'undefined') {
			obj.meta = {
				revision: 0,
				created: 0
			};
		}
		// if cloning, give user back clone of 'cloned' object with $loki and meta
		returnObj = this.cloneObjects ? Helper.clone(obj, this.cloneMethod) : obj;
		// allow pre-insert to modify actual collection reference even if cloning
		if (!bulkInsert) {
			this.emit('pre-insert', obj);
		}
		if (!this.add(obj)) {
			return undefined;
		}
		this.addAutoUpdateObserver(returnObj);
		if (!bulkInsert) {
			this.emit('insert', returnObj);
		}
		return returnObj;
	}

	/**
	 * Empties the collection.
	 * @param {object=} options - configure clear behavior
	 * @param {boolean} options.removeIndices - (default: false)
	 */
	clear(options) {
		options = options || {};
		this.data = [];
		this.idIndex = [];
		this.cachedIndex = null;
		this.cachedBinaryIndex = null;
		this.cachedData = null;
		this.maxId = 0;
		this.DynamicViews = [];
		this.dirty = true;
		// if removing indices entirely
		if (options.removeIndices === true) {
			this.binaryIndices = {};
			this.constraints = {
				unique: {},
				exact: {}
			};
			this.uniqueNames = [];
		}
		// clear indices but leave definitions in place
		else {
			// clear binary indices
			Object.keys(this.binaryIndices).map(biname => {
				this.binaryIndices[biname].dirty = false;
				this.binaryIndices[biname].values = [];
			});
			// clear entire unique indices definition
			this.constraints = {
				unique: {},
				exact: {}
			};
			// add definitions back
			this.uniqueNames.map(uiname => this.ensureUniqueIndex(uiname));
		}
	}

	/**
	 * Updates an object and notifies collection that the document has changed.
	 * @param {object} doc - document to update within the collection
	 */
	update(doc) {
		if (Array.isArray(doc)) {
			let k = doc.length;
			while (k--) {
				this.update(doc[k]);
			}
			return;
		}
		// verify object is a properly formed document
		if (!hasOwnProperty.call(doc, '$loki')) {
			throw new Error('Trying to update unsynced document. Please save the document first by using insert() or addMany()');
		}
		try {
			this.startTransaction();
			let arr = this.get(doc.$loki, true);
			if (!arr) {
				throw new Error('Trying to update a document not in collection.');
			}
			let oldInternal = arr[0]; // -internal- obj ref
			let position = arr[1]; // position in data array
			// if configured to clone, do so now... otherwise just use same obj reference
			let newInternal = this.cloneObjects ? clone(doc, this.cloneMethod) : doc;
			this.emit('pre-update', doc);
			Object.keys(this.constraints.unique).map(key => this.constraints.unique[key].update(oldInternal, newInternal));
			// operate the update
			this.data[position] = newInternal;
			if (newInternal !== doc) {
				this.addAutoUpdateObserver(doc);
			}
			// now that we can efficiently determine the data[] position of newly added document,
			// submit it for all registered DynamicViews to evaluate for inclusion/exclusion
			let idx = this.DynamicViews.length;
			while (idx--) {
				this.DynamicViews[idx].evaluateDocument(position, false);
			}
			if (this.adaptiveBinaryIndices) {
				// for each binary index defined in collection, immediately update rather than flag for lazy rebuild
				for (let key in this.binaryIndices) {
					this.adaptiveBinaryIndexUpdate(position, key);
				}
			} else {
				this.flagBinaryIndexesDirty();
			}
			this.idIndex[position] = newInternal.$loki;
			this.commit();
			this.dirty = true; // for autosave scenarios
			this.emit('update', doc, this.cloneObjects ? Helper.clone(oldInternal, this.cloneMethod) : null);
			return doc;
		} catch (err) {
			this.rollback();
			this.console.error(err.message);
			this.emit('error', err);
			throw (err); // re-throw error so user does not think it succeeded
		}
	}

	/**
	 * Add object to collection
	 */
	add(obj) {
		// if parameter isn't object exit with throw
		if ('object' !== typeof obj) {
			throw new TypeError('Object being added needs to be an object');
		}
		// if object you are adding already has id column it is either already in the collection
		// or the object is carrying its own 'id' property.  If it also has a meta property,
		// then this is already in collection so throw error, otherwise rename to originalId and continue adding.
		if (typeof (obj.$loki) !== 'undefined') {
			throw new Error('Document is already in collection, please use update()');
		}
		//try adding object to collection
		try {
			this.startTransaction();
			this.maxId++;
			if (isNaN(this.maxId)) {
				this.maxId = (this.data[this.data.length - 1].$loki + 1);
			}
			obj.$loki = this.maxId;
			obj.meta.version = 0;
			let key;
			let constrUnique = this.constraints.unique;
			for (let key in constrUnique) {
				if (hasOwnProperty.call(constrUnique, key)) {
					constrUnique[key].set(obj);
				}
			}
			// add new obj id to idIndex
			this.idIndex.push(obj.$loki);
			// add the object
			this.data.push(obj);
			let addedPos = this.data.length - 1;
			// now that we can efficiently determine the data[] position of newly added document,
			// submit it for all registered DynamicViews to evaluate for inclusion/exclusion
			let i = this.DynamicViews.length;
			while (i--) {
				this.DynamicViews[i].evaluateDocument(addedPos, true);
			}
			if (this.adaptiveBinaryIndices) {
				// for each binary index defined in collection, immediately update rather than flag for lazy rebuild
				let bIndices = this.binaryIndices;
				for (key in bIndices) {
					this.adaptiveBinaryIndexInsert(addedPos, key);
				}
			} else {
				this.flagBinaryIndexesDirty();
			}
			this.commit();
			this.dirty = true; // for autosave scenarios
			return (this.cloneObjects ? Helper.clone(obj, this.cloneMethod) : obj);
		} catch (err) {
			this.rollback();
			this.console.error(err.message);
			this.emit('error', err);
			throw (err); // re-throw error so user does not think it succeeded
		}
	}

	/**
	 * Applies a filter function and passes all results to an update function.
	 *
	 * @param {function} filterFunction - filter function whose results will execute update
	 * @param {function} updateFunction - update function to run against filtered documents
	 */
	updateWhere(filterFunction, updateFunction) {
		let results = this.where(filterFunction);
		let obj;
		try {
			let i = results.length;
			while (i--) {
				obj = updateFunction(results[i]);
				this.update(obj);
			}
		} catch (err) {
			this.rollback();
			this.console.error(err.message);
		}
	}

	/**
	 * Remove all documents matching supplied filter function.
	 * For 'mongo-like' querying you should migrate to [findAndRemove()]{@link Collection#findAndRemove}.
	 * @param {function|object} query - query object to filter on
	 */
	removeWhere(query) {
		if (typeof query === 'function') {
			let list = this.data.filter(query);
			this.remove(list);
		} else {
			this.chain().find(query).remove();
		}
	}

	removeDataOnly() {
		this.remove(this.data.slice());
	}

	/**
	 * Remove a document from the collection
	 * @param {object} doc - document to remove from collection
	 * @memberof Collection
	 */
	remove(doc) {
		if (typeof doc === 'number') {
			doc = this.get(doc);
		}
		if ('object' !== typeof doc) {
			throw new Error('Parameter is not an object');
		}
		if (Array.isArray(doc)) {
			let k = doc.length;
			while (k--) {
				this.remove(doc[k]);
			}
			return;
		}
		if (!hasOwnProperty.call(doc, '$loki')) {
			throw new Error('Object is not a document stored in the collection');
		}
		try {
			this.startTransaction();
			let arr = this.get(doc.$loki, true);
			let position = arr[1];
			Object.keys(this.constraints.unique).map(key => {
				if (doc[key] !== null && typeof doc[key] !== 'undefined') {
					this.constraints.unique[key].remove(doc[key]);
				}
			});
			// now that we can efficiently determine the data[] position of newly added document,
			// submit it for all registered DynamicViews to remove
			let idx = this.DynamicViews.length;
			while (idx--) {
				this.DynamicViews[idx].removeDocument(position);
			}
			if (this.adaptiveBinaryIndices) {
				// for each binary index defined in collection, immediately update rather than flag for lazy rebuild
				for (let key in this.binaryIndices) {
					this.adaptiveBinaryIndexRemove(position, key);
				}
			} else {
				this.flagBinaryIndexesDirty();
			}
			this.data.splice(position, 1);
			this.removeAutoUpdateObserver(doc);
			// remove id from idIndex
			this.idIndex.splice(position, 1);
			this.commit();
			this.dirty = true; // for autosave scenarios
			this.emit('delete', arr[0]);
			delete doc.$loki;
			delete doc.meta;
			return doc;
		} catch (err) {
			this.rollback();
			this.console.error(err.message);
			this.emit('error', err);
			return null;
		}
	}

	/*---------------------+
	 | Finding methods     |
	 +----------------------*/

	/**
	 * Get by Id - faster than other methods because of the searching algorithm
	 * @param {int} id - $loki id of document you want to retrieve
	 * @param {boolean} returnPosition - if 'true' we will return [object, position]
	 * @returns {(object|array|null)} Object reference if document was found, null if not,
	 *     or an array if 'returnPosition' was passed.
	 * @memberof Collection
	 */
	get(id, returnPosition = false) {
		let retpos = returnPosition || false;
		let data = this.idIndex;
		let max = data.length - 1;
		let min = 0;
		let mid = (min + max) >> 1;
		id = typeof id === 'number' ? id : parseInt(id, 10);
		if (isNaN(id)) {
			throw new TypeError('Passed id is not an integer');
		}
		while (data[min] < data[max]) {
			mid = (min + max) >> 1;
			if (data[mid] < id) {
				min = mid + 1;
			} else {
				max = mid;
			}
		}
		if (max === min && data[min] === id) {
			if (retpos) {
				return [this.data[min], min];
			}
			return this.data[min];
		}
		return null;
	}

	/**
	 * Perform binary range lookup for the data[dataPosition][binaryIndexName] property value
	 *    Since multiple documents may contain the same value (which the index is sorted on),
	 *    we hone in on range and then linear scan range to find exact index array position.
	 * @param {int} dataPosition : coll.data array index/position
	 * @param {string} binaryIndexName : index to search for dataPosition in
	 */
	getBinaryIndexPosition(dataPosition, binaryIndexName) {
		let val = this.data[dataPosition][binaryIndexName];
		let index = this.binaryIndices[binaryIndexName].values;
		// i think calculateRange can probably be moved to collection
		// as it doesn't seem to need resultset.  need to verify
		//var rs = new Resultset(this, null, null);
		let range = this.calculateRange("$eq", binaryIndexName, val);
		if (range[0] === 0 && range[1] === -1) {
			// uhoh didn't find range
			return null;
		}
		let min = range[0];
		let max = range[1];
		// narrow down the sub-segment of index values
		// where the indexed property value exactly matches our
		// value and then linear scan to find exact -index- position
		for (let idx = min; idx <= max; idx++) {
			if (index[idx] === dataPosition) return idx;
		}
		// uhoh
		return null;
	}

	/**
	 * Adaptively insert a selected item to the index.
	 * @param {int} dataPosition : coll.data array index/position
	 * @param {string} binaryIndexName : index to search for dataPosition in
	 */
	adaptiveBinaryIndexInsert(dataPosition, binaryIndexName) {
		let val = this.data[dataPosition][binaryIndexName];
		//var rs = new Resultset(this, null, null);
		let idxPos = this.calculateRangeStart(binaryIndexName, val);
		// insert new data index into our binary index at the proper sorted location for relevant property calculated by idxPos.
		// doing this after adjusting dataPositions so no clash with previous item at that position.
		this.binaryIndices[binaryIndexName].values.splice(idxPos, 0, dataPosition);
	}

	/**
	 * Adaptively update a selected item within an index.
	 * @param {int} dataPosition : coll.data array index/position
	 * @param {string} binaryIndexName : index to search for dataPosition in
	 */
	adaptiveBinaryIndexUpdate(dataPosition, binaryIndexName) {
		// linear scan needed to find old position within index unless we optimize for clone scenarios later
		// within (my) node 5.6.0, the following for() loop with strict compare is -much- faster than indexOf()
		let index = this.binaryIndices[binaryIndexName].values;
		let idxPos = index.length;
		while (idxPos--) {
			if (index[idxPos] === dataPosition) break;
		}
		this.binaryIndices[binaryIndexName].values.splice(idxPos, 1);
		this.adaptiveBinaryIndexInsert(dataPosition, binaryIndexName);
	}

	/**
	 * Adaptively remove a selected item from the index.
	 * @param {int} dataPosition : coll.data array index/position
	 * @param {string} binaryIndexName : index to search for dataPosition in
	 * @param removedFromIndexOnly
	 */
	adaptiveBinaryIndexRemove(dataPosition, binaryIndexName, removedFromIndexOnly = false) {
		let idxPos = this.getBinaryIndexPosition(dataPosition, binaryIndexName);
		let index = this.binaryIndices[binaryIndexName].values;
		if (idxPos === null) {
			// throw new Error('unable to determine binary index position');
			return null;
		}
		// remove document from index
		this.binaryIndices[binaryIndexName].values.splice(idxPos, 1);
		// if we passed this optional flag parameter, we are calling from adaptiveBinaryIndexUpdate,
		// in which case data positions stay the same.
		if (removedFromIndexOnly === true) {
			return;
		}
		// since index stores data array positions, if we remove a document
		// we need to adjust array positions -1 for all document positions greater than removed position
		let idx = index.length;
		while (idx--) {
			if (index[idx] > dataPosition) {
				index[idx]--;
			}
		}
	}

	/**
	 * Internal method used for index maintenance.  Given a prop (index name), and a value
	 * (which may or may not yet exist) this will find the proper location where it can be added.
	 */
	calculateRangeStart(prop, val) {
		let rcd = this.data;
		let index = this.binaryIndices[prop].values;
		let min = 0;
		let max = index.length - 1;
		let mid = 0;
		if (index.length === 0) {
			return 0;
		}
		let minVal = rcd[index[min]][prop];
		let maxVal = rcd[index[max]][prop];
		// hone in on start position of value
		while (min < max) {
			mid = (min + max) >> 1;
			if (ltHelper(rcd[index[mid]][prop], val, false)) {
				min = mid + 1;
			} else {
				max = mid;
			}
		}
		let lbound = min;
		if (Helper.ltHelper(rcd[index[lbound]][prop], val, false)) {
			return lbound + 1;
		} else {
			return lbound;
		}
	}

	/**
	 * Internal method used for indexed $between.  Given a prop (index name), and a value
	 * (which may or may not yet exist) this will find the final position of that upper range value.
	 */
	calculateRangeEnd(prop, val) {
		let rcd = this.data;
		let index = this.binaryIndices[prop].values;
		let min = 0;
		let max = index.length - 1;
		let mid = 0;
		if (index.length === 0) {
			return 0;
		}
		let minVal = rcd[index[min]][prop];
		let maxVal = rcd[index[max]][prop];
		// hone in on start position of value
		while (min < max) {
			mid = (min + max) >> 1;
			if (Helper.ltHelper(val, rcd[index[mid]][prop], false)) {
				max = mid;
			} else {
				min = mid + 1;
			}
		}
		return Helper.gtHelper(rcd[index[max]][prop], val, false) ? max - 1 : max;
	}

	/**
	 * calculateRange() - Binary Search utility method to find range/segment of values matching criteria.
	 *    this is used for collection.find() and first find filter of resultset/dynview
	 *    slightly different than get() binary search in that get() hones in on 1 value,
	 *    but we have to hone in on many (range)
	 * @param {string} op - operation, such as $eq
	 * @param {string} prop - name of property to calculate range for
	 * @param {object} val - value to use for range calculation.
	 * @returns {Array} [start, end] index array positions
	 */
	calculateRange(op, prop, val) {
		let rcd = this.data;
		let index = this.binaryIndices[prop].values;
		let min = 0;
		let max = index.length - 1;
		let mid = 0;
		// when no documents are in collection, return empty range condition
		if (rcd.length === 0) {
			return [0, -1];
		}
		let minVal = rcd[index[min]][prop];
		let maxVal = rcd[index[max]][prop];
		// if value falls outside of our range return [0, -1] to designate no results
		switch (op) {
			case '$eq':
			case '$aeq':
				if (Helper.ltHelper(val, minVal, false) || Helper.gtHelper(val, maxVal, false)) {
					return [0, -1];
				}
				break;
			case '$dteq':
				if (Helper.ltHelper(val, minVal, false) || Helper.gtHelper(val, maxVal, false)) {
					return [0, -1];
				}
				break;
			case '$gt':
				if (Helper.gtHelper(val, maxVal, true)) {
					return [0, -1];
				}
				break;
			case '$gte':
				if (Helper.gtHelper(val, maxVal, false)) {
					return [0, -1];
				}
				break;
			case '$lt':
				if (Helper.ltHelper(val, minVal, true)) {
					return [0, -1];
				}
				if (Helper.ltHelper(maxVal, val, false)) {
					return [0, rcd.length - 1];
				}
				break;
			case '$lte':
				if (Helper.ltHelper(val, minVal, false)) {
					return [0, -1];
				}
				if (Helper.ltHelper(maxVal, val, true)) {
					return [0, rcd.length - 1];
				}
				break;
			case '$between':
				return ([this.calculateRangeStart(prop, val[0]), this.calculateRangeEnd(prop, val[1])]);
			case '$in':
				let idxset = [];
				let segResult = [];
				// query each value '$eq' operator and merge the seqment results.
				let j = val.length;
				while (j--) {
					let seg = this.calculateRange('$eq', prop, val[j]);
					for (let i = seg[0]; i <= seg[1]; i++) {
						if (idxset[i] === undefined) {
							idxset[i] = true;
							segResult.push(i);
						}
					}
				}
				return segResult;
		}
		// hone in on start position of value
		while (min < max) {
			mid = (min + max) >> 1;
			if (Helper.ltHelper(rcd[index[mid]][prop], val, false)) {
				min = mid + 1;
			} else {
				max = mid;
			}
		}
		let lbound = min;
		// do not reset min, as the upper bound cannot be prior to the found low bound
		max = index.length - 1;
		// hone in on end position of value
		while (min < max) {
			mid = (min + max) >> 1;
			if (Helper.ltHelper(val, rcd[index[mid]][prop], false)) {
				max = mid;
			} else {
				min = mid + 1;
			}
		}
		let ubound = max;
		let lval = rcd[index[lbound]][prop];
		let uval = rcd[index[ubound]][prop];
		switch (op) {
			case '$eq':
				if (lval !== val) {
					return [0, -1];
				}
				if (uval !== val) {
					ubound--;
				}
				return [lbound, ubound];
			case '$dteq':
				if (lval > val || lval < val) {
					return [0, -1];
				}
				if (uval > val || uval < val) {
					ubound--;
				}
				return [lbound, ubound];
			case '$gt':
				if (Helper.ltHelper(uval, val, true)) {
					return [0, -1];
				}
				return [ubound, rcd.length - 1];
			case '$gte':
				if (Helper.ltHelper(lval, val, false)) {
					return [0, -1];
				}
				return [lbound, rcd.length - 1];
			case '$lt':
				if (lbound === 0 && Helper.ltHelper(lval, val, false)) {
					return [0, 0];
				}
				return [0, lbound - 1];
			case '$lte':
				if (uval !== val) {
					ubound--;
				}
				if (ubound === 0 && Helper.ltHelper(uval, val, false)) {
					return [0, 0];
				}
				return [0, ubound];
			default:
				return [0, rcd.length - 1];
		}
	}

	/**
	 * Retrieve doc by Unique index
	 * @param {string} field - name of uniquely indexed property to use when doing lookup
	 * @param {value} value - unique value to search for
	 * @returns {object} document matching the value passed
	 * @memberof Collection
	 */
	by(field, value) {
		if (value === undefined) {
			return value => this.by(field, value);
		}
		let result = this.constraints.unique[field].get(value);
		if (!this.cloneObjects) {
			return result;
		} else {
			return Helper.clone(result, this.cloneMethod);
		}
	}

	/**
	 * Find one object by index property, by property equal to value
	 * @param {object} query - query object used to perform search with
	 * @returns {(object|null)} First matching document, or null if none
	 * @memberof Collection
	 */
	findOne(query) {
		query = query || {};
		// Instantiate Resultset and exec find op passing firstOnly = true param
		let result = new Resultset(this, {
			queryObj: query,
			firstOnly: true
		});
		if (Array.isArray(result) && result.length === 0) {
			return null;
		} else {
			if (!this.cloneObjects) {
				return result;
			} else {
				return Helper.clone(result, this.cloneMethod);
			}
		}
	}

	/**
	 * Chain method, used for beginning a series of chained find() and/or view() operations
	 * on a collection.
	 *
	 * @param {array} transform - Ordered array of transform step objects similar to chain
	 * @param {object} parameters - Object containing properties representing parameters to substitute
	 * @returns {Resultset} (this) resultset, or data array if any map or join functions where called
	 * @memberof Collection
	 */
	chain(transform, parameters) {
		let rs = new Resultset(this);
		return typeof transform === 'undefined' ? rs : rs.transform(transform, parameters);
	}

	/**
	 * Find method, api is similar to mongodb.
	 * for more complex queries use [chain()]{@link Collection#chain} or [where()]{@link Collection#where}.
	 * @example {@tutorial Query Examples}
	 * @param {object} query - 'mongo-like' query object
	 * @returns {Array|Resultset} Array of matching documents
	 * @memberof Collection
	 */
	find(query) {
		if (typeof (query) === 'undefined') {
			query = 'getAll';
		}
		let results = new Resultset(this, {queryObj: query});
		return !this.cloneObjects ? results : Helper.cloneObjectArray(results, this.cloneMethod);
	}

	/**
	 * Find object by unindexed field by property equal to value,
	 * simply iterates and returns the first element matching the query
	 */
	findOneUnindexed(prop, value) {
		let i = this.data.length;
		let doc;
		while (i--) {
			if (this.data[i][prop] === value) {
				doc = this.data[i];
				return doc;
			}
		}
		return null;
	}

	/**
	 * Transaction methods
	 */

	/** start the transation */
	startTransaction() {
		if (this.transactional) {
			this.cachedData = clone(this.data, this.cloneMethod);
			this.cachedIndex = this.idIndex;
			this.cachedBinaryIndex = this.binaryIndices;
			// propagate startTransaction to dynamic views
			let idx = this.DynamicViews.length;
			while (idx--) {
				this.DynamicViews[idx].startTransaction();
			}
		}
	}

	/** commit the transation */
	commit() {
		if (this.transactional) {
			this.cachedData = null;
			this.cachedIndex = null;
			this.cachedBinaryIndex = null;
			// propagate commit to dynamic views
			let idx = this.DynamicViews.length;
			while (idx--) {
				this.DynamicViews[idx].commit();
			}
		}
	}

	/** roll back the transation */
	rollback() {
		if (this.transactional) {
			if (this.cachedData !== null && this.cachedIndex !== null) {
				this.data = this.cachedData;
				this.idIndex = this.cachedIndex;
				this.binaryIndices = this.cachedBinaryIndex;
			}
			// propagate rollback to dynamic views
			let idx = this.DynamicViews.length;
			while (idx--) {
				this.DynamicViews[idx].rollback();
			}
		}
	}

	// async executor. This is only to enable callbacks at the end of the execution.
	async(fun, callback) {
		setTimeout(function () {
			if (typeof fun === 'function') {
				fun();
				callback();
			} else {
				throw new TypeError('Argument passed for async execution is not a function');
			}
		}, 0);
	}

	/**
	 * Query the collection by supplying a javascript filter function.
	 * @example
	 * var results = coll.where(function(obj) {
     *   return obj.legs === 8;
     * });
	 *
	 * @param {function} fun - filter function to run against all collection docs
	 * @returns {Array} all documents which pass your filter function
	 * @memberof Collection
	 */
	where(fun) {
		let results = new Resultset(this, {
			queryFunc: fun
		});
		return !this.cloneObjects ? results : Helper.cloneObjectArray(results, this.cloneMethod);
	}

	/**
	 * Map Reduce operation
	 *
	 * @param {function} mapFunction - function to use as map function
	 * @param {function} reduceFunction - function to use as reduce function
	 * @returns {data} The result of your mapReduce operation
	 * @memberof Collection
	 */
	mapReduce(mapFunction, reduceFunction) {
		try {
			return reduceFunction(this.data.map(mapFunction));
		} catch (err) {
			throw err;
		}
	}

	/**
	 * Join two collections on specified properties
	 *
	 * @param {Array} joinData - array of documents to 'join' to this collection
	 * @param {string} leftJoinProp - property name in collection
	 * @param {string} rightJoinProp - property name in joinData
	 * @param {function=} mapFun - (Optional) map function to use
	 * @returns {Resultset} Result of the mapping operation
	 * @memberof Collection
	 */
	eqJoin(joinData, leftJoinProp, rightJoinProp, mapFun) {
		// logic in Resultset class
		return new Resultset(this).eqJoin(joinData, leftJoinProp, rightJoinProp, mapFun);
	}

	/* ------ STAGING API -------- */
	/**
	 * (Staging API) create a stage and/or retrieve it
	 * @memberof Collection
	 */
	getStage(name) {
		if (!this.stages[name]) {
			this.stages[name] = {};
		}
		return this.stages[name];
	}

	/**
	 * (Staging API) create a copy of an object and insert it into a stage
	 * @memberof Collection
	 */
	stage(stageName, obj) {
		let copy = JSON.parse(JSON.stringify(obj));
		this.getStage(stageName)[obj.$loki] = copy;
		return copy;
	}

	/**
	 * (Staging API) re-attach all objects to the original collection, so indexes and views can be rebuilt
	 * then create a message to be inserted in the commitlog
	 * @param {string} stageName - name of stage
	 * @param {string} message
	 * @memberof Collection
	 */
	commitStage(stageName, message) {
		let stage = this.getStage(stageName);
		let prop;
		let timestamp = new Date().getTime();
		for (prop in stage) {
			this.update(stage[prop]);
			this.commitLog.push({
				timestamp: timestamp,
				message: message,
				data: JSON.parse(JSON.stringify(stage[prop]))
			});
		}
		this.stages[stageName] = {};
	}

	/**
	 * @memberof Collection
	 */
	extract(field) {
		let i = this.data.length;
		let isDotNotation = Utils.isDeepProperty(field);
		let result = [];
		while (i--) {
			result.push(Utils.deepProperty(this.data[i], field, isDotNotation));
		}
		return result;
	}

	/**
	 * @memberof Collection
	 */
	max(field) {
		return Math.max.apply(null, this.extract(field));
	}

	/**
	 * @memberof Collection
	 */
	min(field) {
		return Math.min.apply(null, this.extract(field));
	}

	/**
	 * @memberof Collection
	 */
	maxRecord(field) {
		let i = this.data.length;
		let deep = Utils.isDeepProperty(field);
		let result = {
			index: 0,
			value: undefined
		};
		let max;

		while (i--) {
			if (max !== undefined) {
				if (max < Utils.deepProperty(this.data[i], field, deep)) {
					max = Utils.deepProperty(this.data[i], field, deep);
					result.index = this.data[i].$loki;
				}
			} else {
				max = Utils.deepProperty(this.data[i], field, deep);
				result.index = this.data[i].$loki;
			}
		}
		result.value = max;
		return result;
	}

	/**
	 * @memberof Collection
	 */
	minRecord(field) {
		let i = this.data.length;
		let deep = Utils.isDeepProperty(field);
		let result = {
			index: 0,
			value: undefined
		};
		let min;

		while (i--) {
			if (min !== undefined) {
				if (min > Utils.deepProperty(this.data[i], field, deep)) {
					min = Utils.deepProperty(this.data[i], field, deep);
					result.index = this.data[i].$loki;
				}
			} else {
				min = Utils.deepProperty(this.data[i], field, deep);
				result.index = this.data[i].$loki;
			}
		}
		result.value = min;
		return result;
	}

	/**
	 * @memberof Collection
	 */
	extractNumerical(field) {
		return this.extract(field).map(parseBase10).filter(Number).filter(function (n) {
			return !(isNaN(n));
		});
	}

	/**
	 * Calculates the average numerical value of a property
	 *
	 * @param {string} field - name of property in docs to average
	 * @returns {number} average of property in all docs in the collection
	 * @memberof Collection
	 */
	avg(field) {
		return Utils.average(this.extractNumerical(field));
	}

	/**
	 * Calculate standard deviation of a field
	 * @memberof Collection
	 * @param {string} field
	 */
	stdDev(field) {
		return Utils.standardDeviation(this.extractNumerical(field));
	}

	/**
	 * @memberof Collection
	 * @param {string} field
	 */
	mode(field) {
		let dict = {};
		let data = this.extract(field);
		data.map(obj => dict[obj] ? dict[obj] += 1 : dict[obj] = 1);
		let max;
		let mode;
		for (let prop in dict) {
			if (max) {
				if (max < dict[prop]) {
					mode = prop;
				}
			} else {
				mode = prop;
				max = dict[prop];
			}
		}
		return mode;
	}

	/**
	 * @memberof Collection
	 * @param {string} field - property name
	 */
	median(field) {
		let values = this.extractNumerical(field);
		values.sort(Utils.sub);
		let half = Math.floor(values.length / 2);
		if (values.length % 2) {
			return values[half];
		} else {
			return (values[half - 1] + values[half]) / 2.0;
		}
	}

}

module.exports = Collection;