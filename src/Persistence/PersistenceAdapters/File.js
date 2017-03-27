const FenrirPersistenceAdapter = require('../FenrirPersistenceAdapter');

class File extends FenrirPersistenceAdapter {

	constructor(objectIdentifierProperty, indexEntryIdentifierProperty, options) {
		super(objectIdentifierProperty, indexEntryIdentifierProperty, options);
	}

}

module.exports = File;