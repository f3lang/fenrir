const AbstractIndex = require('./AbstractIndex');

/**
 * The IdIndex keeps track of the $fenrir ids in the database
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class IdIndex extends AbstractIndex {

	constructor() {
		super();
		this.lastIndex = 0;
	}

	getLastIndex(){

	}

}

module.exports = IdIndex;