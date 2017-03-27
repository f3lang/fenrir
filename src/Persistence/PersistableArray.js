const AbstractPersistableElement = require('./AbstractPersistableElement');

class PersistableArray extends AbstractPersistableElement{

	constructor(persistenceAdapter) {
		super(persistenceAdapter);
		this._data = [];
	}

	push(document){
		this._data.push(document);
	}

}

module.exports = PersistableArray;