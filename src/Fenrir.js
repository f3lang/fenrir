const FenrirEventEmitter = require('./FenrirEventEmitter');

/**
 * The Main Loki Class. Based on https://github.com/techfort/LokiJS
 * @author Wolfgang Felbermeier
 */
class Fenrir extends FenrirEventEmitter {

	/**
	 *
	 * @param directory
	 * @param {Object} options The options to init Fenrir
	 */
	constructor(directory, options) {
		super();
	}

	loadDatabase(options, callback) {
		var cFun = callback || function (err, data) {
					if (err) {
						throw err;
					}
				},
			self = this;

		// the persistenceAdapter should be present if all is ok, but check to be sure.
		if (this.persistenceAdapter !== null) {

			this.persistenceAdapter.loadDatabase(this.filename, function loadDatabaseCallback(dbString) {
				if (typeof (dbString) === 'string') {
					var parseSuccess = false;
					try {
						self.loadJSON(dbString, options || {});
						parseSuccess = true;
					} catch (err) {
						cFun(err);
					}
					if (parseSuccess) {
						cFun(null);
						self.emit('loaded', 'database ' + self.filename + ' loaded');
					}
				} else {
					// if adapter has returned an js object (other than null or error) attempt to load from JSON object
					if (typeof (dbString) === "object" && dbString !== null && !(dbString instanceof Error)) {
						self.loadJSONObject(dbString, options || {});
						cFun(null); // return null on success
						self.emit('loaded', 'database ' + self.filename + ' loaded');
					} else {
						// error from adapter (either null or instance of error), pass on to 'user' callback
						cFun(dbString);
					}
				}
			});

		} else {
			cFun(new Error('persistenceAdapter not configured'));
		}
	}

	/**
	 * Handles saving to file system, local storage, or adapter (indexeddb)
	 *    This method utilizes loki configuration options (if provided) to determine which
	 *    persistence method to use, or environment detection (if configuration was not provided).
	 *
	 * @param {function=} callback - (Optional) user supplied async callback / error handler
	 * @memberof Loki
	 */
	saveDatabase(callback) {
		var cFun = callback || function (err) {
					if (err) {
						throw err;
					}
					return;
				},
			self = this;

		// the persistenceAdapter should be present if all is ok, but check to be sure.
		if (this.persistenceAdapter !== null) {
			// check if the adapter is requesting (and supports) a 'reference' mode export
			if (this.persistenceAdapter.mode === "reference" && typeof this.persistenceAdapter.exportDatabase === "function") {
				// filename may seem redundant but loadDatabase will need to expect this same filename
				this.persistenceAdapter.exportDatabase(this.filename, this.copy({removeNonSerializable: true}), function exportDatabaseCallback(err) {
					self.autosaveClearFlags();
					cFun(err);
				});
			}
			// otherwise just pass the serialized database to adapter
			else {
				this.persistenceAdapter.saveDatabase(this.filename, self.serialize(), function saveDatabasecallback(err) {
					self.autosaveClearFlags();
					cFun(err);
				});
			}
		} else {
			cFun(new Error('persistenceAdapter not configured'));
		}
	}

// alias

	save = Loki.prototype.saveDatabase;

	/**
	 * Handles deleting a database from file system, local
	 *    storage, or adapter (indexeddb)
	 *    This method utilizes loki configuration options (if provided) to determine which
	 *    persistence method to use, or environment detection (if configuration was not provided).
	 *
	 * @param {object} options - not currently used (remove or allow overrides?)
	 * @param {function=} callback - (Optional) user supplied async callback / error handler
	 * @memberof Loki
	 */
	deleteDatabase(options, callback) {
		var cFun = callback || function (err, data) {
				if (err) {
					throw err;
				}
			}

		// the persistenceAdapter should be present if all is ok, but check to be sure.
		if (this.persistenceAdapter !== null) {
			this.persistenceAdapter.deleteDatabase(this.filename, function deleteDatabaseCallback(err) {
				cFun(err);
			});
		} else {
			cFun(new Error('persistenceAdapter not configured'));
		}
	}

	/**
	 * autosaveDirty - check whether any collections are 'dirty' meaning we need to save (entire) database
	 *
	 * @returns {boolean} - true if database has changed since last autosave, false if not.
	 */
	autosaveDirty() {
		for (var idx = 0; idx < this.collections.length; idx++) {
			if (this.collections[idx].dirty) {
				return true;
			}
		}

		return false;
	}

	/**
	 * autosaveClearFlags - resets dirty flags on all collections.
	 *    Called from saveDatabase() after db is saved.
	 *
	 */
	autosaveClearFlags() {
		for (var idx = 0; idx < this.collections.length; idx++) {
			this.collections[idx].dirty = false;
		}
	}

	/**
	 * autosaveEnable - begin a javascript interval to periodically save the database.
	 *
	 * @param {object} options - not currently used (remove or allow overrides?)
	 * @param {function=} callback - (Optional) user supplied async callback
	 */
	autosaveEnable(options, callback) {
		this.autosave = true;

		var delay = 5000,
			self = this;

		if (typeof (this.autosaveInterval) !== 'undefined' && this.autosaveInterval !== null) {
			delay = this.autosaveInterval;
		}

		this.autosaveHandle = setInterval(function autosaveHandleInterval() {
			// use of dirty flag will need to be hierarchical since mods are done at collection level with no visibility of 'db'
			// so next step will be to implement collection level dirty flags set on insert/update/remove
			// along with loki level isdirty() function which iterates all collections to see if any are dirty

			if (self.autosaveDirty()) {
				self.saveDatabase(callback);
			}
		}, delay);
	}

	/**
	 * autosaveDisable - stop the autosave interval timer.
	 *
	 */
	autosaveDisable() {
		if (typeof (this.autosaveHandle) !== 'undefined' && this.autosaveHandle !== null) {
			clearInterval(this.autosaveHandle);
			this.autosaveHandle = null;
		}
	}

	/**-------------------------+
	 | Changes API               |
	 +--------------------------*/

	/**
	 * The Changes API enables the tracking the changes occurred in the collections since the beginning of the session,
	 * so it's possible to create a differential dataset for synchronization purposes (possibly to a remote db)
	 */

	/**
	 * (Changes API) : takes all the changes stored in each
	 * collection and creates a single array for the entire database. If an array of names
	 * of collections is passed then only the included collections will be tracked.
	 *
	 * @param {array=} optional array of collection names. No arg means all collections are processed.
	 * @returns {array} array of changes
	 * @see private method createChange() in Collection
	 * @memberof Loki
	 */
	generateChangesNotification(arrayOfCollectionNames) {
		function getCollName(coll) {
			return coll.name;
		}

		var changes = [],
			selectedCollections = arrayOfCollectionNames || this.collections.map(getCollName);

		this.collections.forEach(function (coll) {
			if (selectedCollections.indexOf(getCollName(coll)) !== -1) {
				changes = changes.concat(coll.getChanges());
			}
		});
		return changes;
	}

	/**
	 * (Changes API) - stringify changes for network transmission
	 * @returns {string} string representation of the changes
	 * @memberof Loki
	 */
	serializeChanges(collectionNamesArray) {
		return JSON.stringify(this.generateChangesNotification(collectionNamesArray));
	}

	/**
	 * (Changes API) : clears all the changes in all collections.
	 * @memberof Loki
	 */
	clearChanges() {
		this.collections.forEach(function (coll) {
			if (coll.flushChanges) {
				coll.flushChanges();
			}
		});
	}


	/**
	 * Allows reconfiguring database options
	 *
	 * @param {object} options - configuration options to apply to loki db object
	 * @param {string} options.env - override environment detection as 'NODEJS', 'BROWSER', 'CORDOVA'
	 * @param {boolean} options.verbose - enable console output (default is 'false')
	 * @param {boolean} options.autosave - enables autosave
	 * @param {int} options.autosaveInterval - time interval (in milliseconds) between saves (if dirty)
	 * @param {boolean} options.autoload - enables autoload on loki instantiation
	 * @param {function} options.autoloadCallback - user callback called after database load
	 * @param {adapter} options.adapter - an instance of a loki persistence adapter
	 * @param {string} options.serializationMethod - ['normal', 'pretty', 'destructured']
	 * @param {string} options.destructureDelimiter - string delimiter used for destructured serialization
	 * @param {boolean} initialConfig - (internal) true is passed when loki ctor is invoking
	 * @memberof Loki
	 */
	configureOptions(options, initialConfig) {
		var defaultPersistence = {
				'NODEJS': 'fs',
				'BROWSER': 'localStorage',
				'CORDOVA': 'localStorage'
			},
			persistenceMethods = {
				'fs': LokiFsAdapter,
				'localStorage': LokiLocalStorageAdapter
			}

		this.options = {}

		this.persistenceMethod = null;
		// retain reference to optional persistence adapter 'instance'
		// currently keeping outside options because it can't be serialized
		this.persistenceAdapter = null;

		// process the options
		if (typeof (options) !== 'undefined') {
			this.options = options;

			if (this.options.hasOwnProperty('persistenceMethod')) {
				// check if the specified persistence method is known
				if (typeof (persistenceMethods[options.persistenceMethod]) == 'function') {
					this.persistenceMethod = options.persistenceMethod;
					this.persistenceAdapter = new persistenceMethods[options.persistenceMethod]();
				}
				// should be throw an error here, or just fall back to defaults ??
			}

			// if user passes adapter, set persistence mode to adapter and retain persistence adapter instance
			if (this.options.hasOwnProperty('adapter')) {
				this.persistenceMethod = 'adapter';
				this.persistenceAdapter = options.adapter;
				this.options.adapter = null;
			}


			// if they want to load database on loki instantiation, now is a good time to load... after adapter set and before possible autosave initiation
			if (options.autoload && initialConfig) {
				// for autoload, let the constructor complete before firing callback
				var self = this;
				setTimeout(function () {
					self.loadDatabase(options, options.autoloadCallback);
				}, 1);
			}

			if (this.options.hasOwnProperty('autosaveInterval')) {
				this.autosaveDisable();
				this.autosaveInterval = parseInt(this.options.autosaveInterval, 10);
			}

			if (this.options.hasOwnProperty('autosave') && this.options.autosave) {
				this.autosaveDisable();
				this.autosave = true;

				if (this.options.hasOwnProperty('autosaveCallback')) {
					this.autosaveEnable(options, options.autosaveCallback);
				} else {
					this.autosaveEnable();
				}
			}
		} // end of options processing

		// ensure defaults exists for options which were not set
		if (!this.options.hasOwnProperty('serializationMethod')) {
			this.options.serializationMethod = 'normal';
		}

		// ensure passed or default option exists
		if (!this.options.hasOwnProperty('destructureDelimiter')) {
			this.options.destructureDelimiter = '$<\n';
		}

		// if by now there is no adapter specified by user nor derived from persistenceMethod: use sensible defaults
		if (this.persistenceAdapter === null) {
			this.persistenceMethod = defaultPersistence[this.ENV];
			if (this.persistenceMethod) {
				this.persistenceAdapter = new persistenceMethods[this.persistenceMethod]();
			}
		}

	}

	/**
	 * Copies 'this' database into a new Loki instance. Object references are shared to make lightweight.
	 *
	 * @param {object} options - apply or override collection level settings
	 * @param {bool} options.removeNonSerializable - nulls properties not safe for serialization.
	 * @memberof Loki
	 */

	copy(options) {
		var databaseCopy = new Loki(this.filename);
		var clen, idx;

		options = options || {}

		// currently inverting and letting loadJSONObject do most of the work
		databaseCopy.loadJSONObject(this, {retainDirtyFlags: true});

		// since our JSON serializeReplacer is not invoked for reference database adapters, this will let us mimic
		if (options.hasOwnProperty("removeNonSerializable") && options.removeNonSerializable === true) {
			databaseCopy.autosaveHandle = null;
			databaseCopy.persistenceAdapter = null;

			clen = databaseCopy.collections.length;
			for (idx = 0; idx < clen; idx++) {
				databaseCopy.collections[idx].constraints = null;
				databaseCopy.collections[idx].ttl = null;
			}
		}

		return databaseCopy;
	}

	/**
	 * Shorthand method for quickly creating and populating an anonymous collection.
	 *    This collection is not referenced internally so upon losing scope it will be garbage collected.
	 *
	 * @example
	 * var results = new loki().anonym(myDocArray).find({'age': {'$gt': 30} });
	 *
	 * @param {Array} docs - document array to initialize the anonymous collection with
	 * @param {object} options - configuration object, see {@link Loki#addCollection} options
	 * @returns {Collection} New collection which you can query or chain
	 * @memberof Loki
	 */
	anonym(docs, options) {
		var collection = new Collection('anonym', options);
		collection.insert(docs);

		if (this.verbose)
			collection.console = console;

		return collection;
	}

	/**
	 * Adds a collection to the database.
	 * @param {string} name - name of collection to add
	 * @param {object=} options - (optional) options to configure collection with.
	 * @param {array} options.unique - array of property names to define unique constraints for
	 * @param {array} options.exact - array of property names to define exact constraints for
	 * @param {array} options.indices - array property names to define binary indexes for
	 * @param {boolean} options.asyncListeners - default is false
	 * @param {boolean} options.disableChangesApi - default is true
	 * @param {boolean} options.autoupdate - use Object.observe to update objects automatically (default: false)
	 * @param {boolean} options.clone - specify whether inserts and queries clone to/from user
	 * @param {string} options.cloneMethod - 'parse-stringify' (default), 'jquery-extend-deep', 'shallow'
	 * @param {int} options.ttlInterval - time interval for clearing out 'aged' documents; not set by default.
	 * @returns {Collection} a reference to the collection which was just added
	 * @memberof Loki
	 */
	addCollection(name, options) {
		var collection = new Collection(name, options);
		this.collections.push(collection);

		if (this.verbose)
			collection.console = console;

		return collection;
	}

	loadCollection(collection) {
		if (!collection.name) {
			throw new Error('Collection must have a name property to be loaded');
		}
		this.collections.push(collection);
	}

	/**
	 * Retrieves reference to a collection by name.
	 * @param {string} collectionName - name of collection to look up
	 * @returns {Collection} Reference to collection in database by that name, or null if not found
	 * @memberof Loki
	 */
	getCollection(collectionName) {
		var i,
			len = this.collections.length;

		for (i = 0; i < len; i += 1) {
			if (this.collections[i].name === collectionName) {
				return this.collections[i];
			}
		}

		// no such collection
		this.emit('warning', 'collection ' + collectionName + ' not found');
		return null;
	}

	listCollections() {

		var i = this.collections.length,
			colls = [];

		while (i--) {
			colls.push({
				name: this.collections[i].name,
				type: this.collections[i].objType,
				count: this.collections[i].data.length
			});
		}
		return colls;
	}

	/**
	 * Removes a collection from the database.
	 * @param {string} collectionName - name of collection to remove
	 * @memberof Loki
	 */
	removeCollection(collectionName) {
		var i,
			len = this.collections.length;

		for (i = 0; i < len; i += 1) {
			if (this.collections[i].name === collectionName) {
				var tmpcol = new Collection(collectionName, {});
				var curcol = this.collections[i];
				for (var prop in curcol) {
					if (curcol.hasOwnProperty(prop) && tmpcol.hasOwnProperty(prop)) {
						curcol[prop] = tmpcol[prop];
					}
				}
				this.collections.splice(i, 1);
				return;
			}
		}
	}

	getName() {
		return this.name;
	}

	/**
	 * serializeReplacer - used to prevent certain properties from being serialized
	 *
	 */
	serializeReplacer(key, value) {
		switch (key) {
			case 'autosaveHandle':
			case 'persistenceAdapter':
			case 'constraints':
			case 'ttl':
				return null;
			default:
				return value;
		}
	}

	/**
	 * Serialize database to a string which can be loaded via {@link Loki#loadJSON}
	 *
	 * @returns {string} Stringified representation of the loki database.
	 * @memberof Loki
	 */
	serialize(options) {
		options = options || {}

		if (!options.hasOwnProperty("serializationMethod")) {
			options.serializationMethod = this.options.serializationMethod;
		}

		switch (options.serializationMethod) {
			case "normal":
				return JSON.stringify(this, this.serializeReplacer);
			case "pretty":
				return JSON.stringify(this, this.serializeReplacer, 2);
			case "destructured":
				return this.serializeDestructured(); // use default options
			default:
				return JSON.stringify(this, this.serializeReplacer);
		}
	}

// alias of serialize

	toJson = Loki.prototype.serialize;

	/**
	 * Destructured JSON serialization routine to allow alternate serialization methods.
	 * Internally, Loki supports destructuring via loki "serializationMethod' option and
	 * the optional LokiPartitioningAdapter class. It is also available if you wish to do
	 * your own structured persistence or data exchange.
	 *
	 * @param {object=} options - output format options for use externally to loki
	 * @param {bool=} options.partitioned - (default: false) whether db and each collection are separate
	 * @param {int=} options.partition - can be used to only output an individual collection or db (-1)
	 * @param {bool=} options.delimited - (default: true) whether subitems are delimited or subarrays
	 * @param {string=} options.delimiter - override default delimiter
	 *
	 * @returns {string|array} A custom, restructured aggregation of independent serializations.
	 * @memberof Loki
	 */

	serializeDestructured(options) {
		var idx, sidx, result, resultlen;
		var reconstruct = [];
		var dbcopy;

		options = options || {}

		if (!options.hasOwnProperty("partitioned")) {
			options.partitioned = false;
		}

		if (!options.hasOwnProperty("delimited")) {
			options.delimited = true;
		}

		if (!options.hasOwnProperty("delimiter")) {
			options.delimiter = this.options.destructureDelimiter;
		}

		// 'partitioned' along with 'partition' of 0 or greater is a request for single collection serialization
		if (options.partitioned === true && options.hasOwnProperty("partition") && options.partition >= 0) {
			return this.serializeCollection({
				delimited: options.delimited,
				delimiter: options.delimiter,
				collectionIndex: options.partition
			});
		}

		// not just an individual collection, so we will need to serialize db container via shallow copy
		dbcopy = new Loki(this.filename);
		dbcopy.loadJSONObject(this);

		for (idx = 0; idx < dbcopy.collections.length; idx++) {
			dbcopy.collections[idx].data = [];
		}

		// if we -only- wanted the db container portion, return it now
		if (options.partitioned === true && options.partition === -1) {
			// since we are deconstructing, override serializationMethod to normal for here
			return dbcopy.serialize({
				serializationMethod: "normal"
			});
		}

		// at this point we must be deconstructing the entire database
		// start by pushing db serialization into first array element
		reconstruct.push(dbcopy.serialize({
			serializationMethod: "normal"
		}));

		dbcopy = null;

		// push collection data into subsequent elements
		for (idx = 0; idx < this.collections.length; idx++) {
			result = this.serializeCollection({
				delimited: options.delimited,
				delimiter: options.delimiter,
				collectionIndex: idx
			});

			// NDA : Non-Delimited Array : one iterable concatenated array with empty string collection partitions
			if (options.partitioned === false && options.delimited === false) {
				if (!Array.isArray(result)) {
					throw new Error("a nondelimited, non partitioned collection serialization did not return an expected array");
				}

				// Array.concat would probably duplicate memory overhead for copying strings.
				// Instead copy each individually, and clear old value after each copy.
				// Hopefully this will allow g.c. to reduce memory pressure, if needed.
				resultlen = result.length;

				for (sidx = 0; sidx < resultlen; sidx++) {
					reconstruct.push(result[sidx]);
					result[sidx] = null;
				}

				reconstruct.push("");
			}
			else {
				reconstruct.push(result);
			}
		}

		// Reconstruct / present results according to four combinations : D, DA, NDA, NDAA
		if (options.partitioned) {
			// DA : Delimited Array of strings [0] db [1] collection [n] collection { partitioned: true, delimited: true }
			// useful for simple future adaptations of existing persistence adapters to save collections separately
			if (options.delimited) {
				return reconstruct;
			}
			// NDAA : Non-Delimited Array with subArrays. db at [0] and collection subarrays at [n] { partitioned: true, delimited : false }
			// This format might be the most versatile for 'rolling your own' partitioned sync or save.
			// Memory overhead can be reduced by specifying a specific partition, but at this code path they did not, so its all.
			else {
				return reconstruct;
			}
		}
		else {
			// D : one big Delimited string { partitioned: false, delimited : true }
			// This is the method Loki will use internally if 'destructured'.
			// Little memory overhead improvements but does not require multiple asynchronous adapter call scheduling
			if (options.delimited) {
				// indicate no more collections
				reconstruct.push("");

				return reconstruct.join(options.delimiter);
			}
			// NDA : Non-Delimited Array : one iterable array with empty string collection partitions { partitioned: false, delimited: false }
			// This format might be best candidate for custom synchronous syncs or saves
			else {
				// indicate no more collections
				reconstruct.push("");

				return reconstruct;
			}
		}

		reconstruct.push("");

		return reconstruct.join(delim);
	}

	/**
	 * Utility method to serialize a collection in a 'destructured' format
	 *
	 * @param {object} options - used to determine output of method
	 * @param {int=} options.delimited - whether to return single delimited string or an array
	 * @param {string=} options.delimiter - (optional) if delimited, this is delimiter to use
	 * @param {int} options.collectionIndex -  specify which collection to serialize data for
	 *
	 * @returns {string|array} A custom, restructured aggregation of independent serializations for a single collection.
	 * @memberof Loki
	 */

	serializeCollection(options) {
		var doccount,
			docidx,
			resultlines = [];

		options = options || {}

		if (!options.hasOwnProperty("delimited")) {
			options.delimited = true;
		}

		if (!options.hasOwnProperty("collectionIndex")) {
			throw new Error("serializeCollection called without 'collectionIndex' option");
		}

		doccount = this.collections[options.collectionIndex].data.length;

		resultlines = [];

		for (docidx = 0; docidx < doccount; docidx++) {
			resultlines.push(JSON.stringify(this.collections[options.collectionIndex].data[docidx]));
		}

		// D and DA
		if (options.delimited) {
			// indicate no more documents in collection (via empty delimited string)
			resultlines.push("");

			return resultlines.join(options.delimiter);
		}
		else {
			// NDAA and NDA
			return resultlines;
		}
	}

	/**
	 * Destructured JSON deserialization routine to minimize memory overhead.
	 * Internally, Loki supports destructuring via loki "serializationMethod' option and
	 * the optional LokiPartitioningAdapter class. It is also available if you wish to do
	 * your own structured persistence or data exchange.
	 *
	 * @param {string|array} destructuredSource - destructured json or array to deserialize from
	 * @param {object=} options - source format options
	 * @param {bool=} options.partitioned - (default: false) whether db and each collection are separate
	 * @param {int=} options.partition - can be used to deserialize only a single partition
	 * @param {bool=} options.delimited - (default: true) whether subitems are delimited or subarrays
	 * @param {string=} options.delimiter - override default delimiter
	 *
	 * @returns {object|array} An object representation of the deserialized database, not yet applied to 'this' db or document array
	 * @memberof Loki
	 */
	deserializeDestructured(destructuredSource, options) {
		var workarray = [];
		var len, cdb;
		var idx, collIndex = 0, collCount, lineIndex = 1, done = false;
		var currLine, currObject;

		options = options || {}

		if (!options.hasOwnProperty("partitioned")) {
			options.partitioned = false;
		}

		if (!options.hasOwnProperty("delimited")) {
			options.delimited = true;
		}

		if (!options.hasOwnProperty("delimiter")) {
			options.delimiter = this.options.destructureDelimiter;
		}

		// Partitioned
		// DA : Delimited Array of strings [0] db [1] collection [n] collection { partitioned: true, delimited: true }
		// NDAA : Non-Delimited Array with subArrays. db at [0] and collection subarrays at [n] { partitioned: true, delimited : false }
		// -or- single partition
		if (options.partitioned) {
			// handle single partition
			if (options.hasOwnProperty('partition')) {
				// db only
				if (options.partition === -1) {
					cdb = JSON.parse(destructuredSource[0]);

					return cdb;
				}

				// single collection, return doc array
				return this.deserializeCollection(destructuredSource[options.partition + 1], options);
			}

			// Otherwise we are restoring an entire partitioned db
			cdb = JSON.parse(destructuredSource[0]);
			collCount = cdb.collections.length;
			for (collIndex = 0; collIndex < collCount; collIndex++) {
				// attach each collection docarray to container collection data, add 1 to collection array index since db is at 0
				cdb.collections[collIndex].data = this.deserializeCollection(destructuredSource[collIndex + 1], options);
			}

			return cdb;
		}

		// Non-Partitioned
		// D : one big Delimited string { partitioned: false, delimited : true }
		// NDA : Non-Delimited Array : one iterable array with empty string collection partitions { partitioned: false, delimited: false }

		// D
		if (options.delimited) {
			workarray = destructuredSource.split(options.delimiter);
			destructuredSource = null; // lower memory pressure
			len = workarray.length;

			if (len === 0) {
				return null;
			}
		}
		// NDA
		else {
			workarray = destructuredSource;
		}

		// first line is database and collection shells
		cdb = JSON.parse(workarray[0]);
		collCount = cdb.collections.length;
		workarray[0] = null;

		while (!done) {
			currLine = workarray[lineIndex];

			// empty string indicates either end of collection or end of file
			if (workarray[lineIndex] === "") {
				// if no more collections to load into, we are done
				if (++collIndex > collCount) {
					done = true;
				}
			}
			else {
				currObject = JSON.parse(workarray[lineIndex]);
				cdb.collections[collIndex].data.push(currObject);
			}

			// lower memory pressure and advance iterator
			workarray[lineIndex++] = null;
		}

		return cdb;
	}

	/**
	 * Deserializes a destructured collection.
	 *
	 * @param {string|array} destructuredSource - destructured representation of collection to inflate
	 * @param {object} options - used to describe format of destructuredSource input
	 * @param {int} options.delimited - whether source is delimited string or an array
	 * @param {string} options.delimiter - (optional) if delimited, this is delimiter to use
	 *
	 * @returns {array} an array of documents to attach to collection.data.
	 * @memberof Loki
	 */
	deserializeCollection(destructuredSource, options) {
		var workarray = [];
		var idx, len;

		options = options || {}

		if (!options.hasOwnProperty("partitioned")) {
			options.partitioned = false;
		}

		if (!options.hasOwnProperty("delimited")) {
			options.delimited = true;
		}

		if (!options.hasOwnProperty("delimiter")) {
			options.delimiter = this.options.destructureDelimiter;
		}

		if (options.delimited) {
			workarray = destructuredSource.split(options.delimiter);
			workarray.pop();
		}
		else {
			workarray = destructuredSource;
		}

		len = workarray.length;
		for (idx = 0; idx < len; idx++) {
			workarray[idx] = JSON.parse(workarray[idx]);
		}

		return workarray;
	}

	/**
	 * Inflates a loki database from a serialized JSON string
	 *
	 * @param {string} serializedDb - a serialized loki database string
	 * @param {object} options - apply or override collection level settings
	 * @memberof Loki
	 */
	loadJSON(serializedDb, options) {
		var dbObject;
		if (serializedDb.length === 0) {
			dbObject = {}
		} else {
			// using option defined in instantiated db not what was in serialized db
			switch (this.options.serializationMethod) {
				case "normal":
				case "pretty":
					dbObject = JSON.parse(serializedDb);
					break;
				case "destructured":
					dbObject = this.deserializeDestructured(serializedDb);
					break;
				default:
					dbObject = JSON.parse(serializedDb);
					break;
			}
		}

		this.loadJSONObject(dbObject, options);
	}

	/**
	 * Inflates a loki database from a JS object
	 *
	 * @param {object} dbObject - a serialized loki database string
	 * @param {object} options - apply or override collection level settings
	 * @param {bool?} options.retainDirtyFlags - whether collection dirty flags will be preserved
	 * @memberof Loki
	 */
	loadJSONObject(dbObject, options) {
		var i = 0,
			len = dbObject.collections ? dbObject.collections.length : 0,
			coll,
			copyColl,
			clen,
			j,
			loader,
			collObj;

		this.name = dbObject.name;

		// restore database version
		this.databaseVersion = 1.0;
		if (dbObject.hasOwnProperty('databaseVersion')) {
			this.databaseVersion = dbObject.databaseVersion;
		}

		this.collections = [];

		function makeLoader(coll) {
			var collOptions = options[coll.name];
			var inflater;

			if (collOptions.proto) {
				inflater = collOptions.inflate || Utils.copyProperties;

				return function (data) {
					var collObj = new (collOptions.proto)();
					inflater(data, collObj);
					return collObj;
				}
			}

			return collOptions.inflate;
		}

		for (i; i < len; i += 1) {
			coll = dbObject.collections[i];
			copyColl = this.addCollection(coll.name);

			copyColl.adaptiveBinaryIndices = coll.hasOwnProperty('adaptiveBinaryIndices') ? (coll.adaptiveBinaryIndices === true) : false;
			copyColl.transactional = coll.transactional;
			copyColl.asyncListeners = coll.asyncListeners;
			copyColl.disableChangesApi = coll.disableChangesApi;
			copyColl.cloneObjects = coll.cloneObjects;
			copyColl.cloneMethod = coll.cloneMethod || "parse-stringify";
			copyColl.autoupdate = coll.autoupdate;
			copyColl.changes = coll.changes;

			if (options && options.retainDirtyFlags === true) {
				copyColl.dirty = coll.dirty;
			}
			else {
				copyColl.dirty = false;
			}

			// load each element individually
			clen = coll.data.length;
			j = 0;
			if (options && options.hasOwnProperty(coll.name)) {
				loader = makeLoader(coll);

				for (j; j < clen; j++) {
					collObj = loader(coll.data[j]);
					copyColl.data[j] = collObj;
					copyColl.addAutoUpdateObserver(collObj);
				}
			} else {

				for (j; j < clen; j++) {
					copyColl.data[j] = coll.data[j];
					copyColl.addAutoUpdateObserver(copyColl.data[j]);
				}
			}

			copyColl.maxId = (coll.data.length === 0) ? 0 : coll.maxId;
			copyColl.idIndex = coll.idIndex;
			if (typeof (coll.binaryIndices) !== 'undefined') {
				copyColl.binaryIndices = coll.binaryIndices;
			}
			if (typeof coll.transforms !== 'undefined') {
				copyColl.transforms = coll.transforms;
			}

			copyColl.ensureId();

			// regenerate unique indexes
			copyColl.uniqueNames = [];
			if (coll.hasOwnProperty("uniqueNames")) {
				copyColl.uniqueNames = coll.uniqueNames;
				for (j = 0; j < copyColl.uniqueNames.length; j++) {
					copyColl.ensureUniqueIndex(copyColl.uniqueNames[j]);
				}
			}

			// in case they are loading a database created before we added dynamic views, handle undefined
			if (typeof (coll.DynamicViews) === 'undefined') continue;

			// reinflate DynamicViews and attached Resultsets
			for (var idx = 0; idx < coll.DynamicViews.length; idx++) {
				var colldv = coll.DynamicViews[idx];

				var dv = copyColl.addDynamicView(colldv.name, colldv.options);
				dv.resultdata = colldv.resultdata;
				dv.resultsdirty = colldv.resultsdirty;
				dv.filterPipeline = colldv.filterPipeline;

				dv.sortCriteria = colldv.sortCriteria;
				dv.sortFunction = null;

				dv.sortDirty = colldv.sortDirty;
				dv.resultset.filteredrows = colldv.resultset.filteredrows;
				dv.resultset.searchIsChained = colldv.resultset.searchIsChained;
				dv.resultset.filterInitialized = colldv.resultset.filterInitialized;

				dv.rematerialize({
					removeWhereFilters: true
				});
			}
		}
	}

	/**
	 * Emits the close event. In autosave scenarios, if the database is dirty, this will save and disable timer.
	 * Does not actually destroy the db.
	 *
	 * @param {function=} callback - (Optional) if supplied will be registered with close event before emitting.
	 * @memberof Loki
	 */
	close(callback) {
		// for autosave scenarios, we will let close perform final save (if dirty)
		// For web use, you might call from window.onbeforeunload to shutdown database, saving pending changes
		if (this.autosave) {
			this.autosaveDisable();
			if (this.autosaveDirty()) {
				this.saveDatabase(callback);
				callback = undefined;
			}
		}

		if (callback) {
			this.on('close', callback);
		}
		this.emit('close');
	}


}

module.exports = Fenrir;