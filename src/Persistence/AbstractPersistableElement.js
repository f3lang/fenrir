/**
 * AbstractPersistableStuff is the base class for all persistable
 * elements in fenrir. e.g. those classes are inherited from this class:
 * - the collection data field
 * - all indices
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class AbstractPersistableElement {

	constructor(persistenceAdapter){
		this.persistenceAdapter = persistenceAdapter;
	}



}

module.exports = AbstractPersistableElement;