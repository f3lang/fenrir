const FenrirEventEmitter = require('./FenrirEventEmitter');
const Configuration = require('./Configuration');
const Collection = require('./Base/Collection');
const uuid = require('uuid').v4;
const path = require('path');

const API_VERSION = 1;

/**
 * The Main Loki Class. Based on https://github.com/techfort/LokiJS
 * @author Wolfgang Felbermeier
 */
class Fenrir extends FenrirEventEmitter {

	/**
	 * Creates a new Instance of Fenrir
	 * @param directory The directory to use for this instance
	 * @param {Object} options Configuration for this instance
	 * @param {String} options.persistenceAdapter The persistence adapter to use for this instance. If there is already an existing database at the
	 * defined location, the persistence adapter used for the location will be used. Defaults to "File".
	 * @param {Object} options.persistenceAdapterOptions The options to init the persistence adapter. For the documentation see the class in /PersistenceAdapters/
	 * @param {String} options.configurationFile The location of the configuration file, defaults to {directory}/fenrir.json. The file includes the configuration of the database.
	 * @param {boolean} options.verbose Defines whether verbose logging to the console should be enabled. Defaults to false.
	 */
	constructor(directory, options) {
		super();

		let defaultOptions = {
			persistenceAdapter: 'File',
			persistenceAdapterOptions: {},
			configurationFile: path.join(directory, 'fenrir.json'),
			verbose: false
		};
		this.options = Object.assign(defaultOptions, options);
		//noinspection JSUnresolvedVariable
		this.config = new Configuration({
			api: API_VERSION,
			persistenceAdapter: this.options.persistenceAdapter,
			collections: [],
			verbose: this.options.verbose
		}, this.options.configurationFile);

		this.collections = {};
		//index to reach collections directly over their names
		this.collectionNameMap = {};
		this.loadDatabase();
	}

	/**
	 * Loads all collections defined in the configuration file into the memory
	 */
	loadDatabase() {
		let collections = this.config.get('collections');

		collections.forEach(collection => {
			let col = new Collection(this, collection.options);
			this.collections[collection.identifier] = col;
			this.collectionNameMap[collection.name] = col;
			const PERSISTENCE_ADAPTER = require('./Persistence/PersistenceAdapters/' + collection.options.persistenceAdapter);
			let persistenceAdapter = new PERSISTENCE_ADAPTER(
				collection.options.objectIdentifierProperty,
				collection.options.indexEntryIdentifierProperty,
				collection.options.persistenceAdapterOptions
			);
			col.attachPersistenceAdapter(persistenceAdapter);
		});
	}

	/**
	 * Adds a collection to the database.
	 * @param {string} name - name of collection to add
	 * @param {object=} options - (optional) options to configure collection with, if not already existent.
	 * @param {string} options.persistenceAdapter The persistence adapter type to use for this collection. Defaults
	 * to File
	 * @param {string} options.objectIdentifierProperty The object identifier for documents
	 * @param {string} options.indexEntryIden
	 * @param {object} options.persistenceAdapterOptions The options to initialize the persistence adapter. Defaults
	 * to the default options for the selected persistence adapter.
	 * @param {array} options.unique - array of property names to define unique constraints for
	 * @returns {Collection} a reference to the collection which was just added
	 * @memberof Fenrir
	 */
	getCollection(name, options) {
		if (this.collectionNameMap[name]) {
			return this.collectionNameMap[name];
		}

		let defaultCollectionOptions = {
			persistenceAdapter: 'File',
			persistenceAdapterOptions: {},
			unique: [],
		};

		let collectionConfiguration = {
			identifier: uuid(),
			name: name,
			options: Object.assign(defaultCollectionOptions, options)
		};

		let collection = new Collection(name, Object.assign(options, {persistenceAdapter: this.options.persistenceAdapter, identifier: collectionConfiguration.identifier}));
		let persistenceAdapter = new (require('./Persistence/PersistenceAdapters/'+options.persistenceAdapter))();
		collection.attachPersistenceAdapter(persistenceAdapter);

		this.collections[collectionConfiguration.identifier] = collection;
		if (this.config.get('verbose')) {
			collection.console = console;
		}

		let collectionConfigEntries = this.config.get('collections');
		collectionConfigEntries.push(collectionConfiguration);
		this.config.set('collections', collectionConfigEntries);

		return collection;
	}

	/**
	 * Get a list of all the collections available in this instance.
	 * Each entry contains the name and the type of the collection along with the number of entries in the collection
	 * @returns {Array}
	 */
	listCollections() {
		return Object.keys(this.collections).map(key => {
			return {
				name: this.collections[key].name,
				type: this.collections[key].objType,
				count: this.collections[key].data.length
			};
		});
	}

	/**
	 * Removes a collection from the database.
	 * @param {string} collectionName - name of collection to remove
	 * @memberof Loki
	 */
	removeCollection(collectionName) {
		let collection = this.collectionNameMap[collectionName];
		delete this.collectionNameMap[collectionName];
		delete this.collections[collection.identifier];
		let collectionConfigEntries = this.config.get('collections');
		let collectionEntryToRemove = collectionConfigEntries.find(entry => entry.identifier == collection.identifier);
		collectionConfigEntries.slice(collectionConfigEntries.indexOf(collectionEntryToRemove), 1);
		this.config.set('collections', collectionConfigEntries);
		collection.nuke();
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
	 * Emits the close event. This is handles
	 * @param {function=} callback - (Optional) if supplied will be registered with close event before emitting.
	 * @memberof Loki
	 */
	close(callback) {
		if (callback) {
			this.on('close', callback);
		}
		this.emit('close');
	}


}

module.exports = Fenrir;