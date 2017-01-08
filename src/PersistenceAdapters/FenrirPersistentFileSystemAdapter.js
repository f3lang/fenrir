const FenrirPersistenceAdapter = require('../FenrirPersistenceAdapter');

class FenrirPersistentFileSystemAdapter extends FenrirPersistenceAdapter {

	constructor(objectIdentifierProperty, indexEntryIdentifierProperty, options) {
		super(objectIdentifierProperty, indexEntryIdentifierProperty, options);
	}

}

module.exports = FenrirPersistentFileSystemAdapter;