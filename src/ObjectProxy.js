/**
 * The Object Proxy is a proxy for the data object in a collection.
 */
class ObjectProxy extends Proxy {

	constructor(original, persistenceAdapter) {
		this.persistenceAdapter = persistenceAdapter;
		super(original, {
			get: (target, name, receiver) => {

			},
			set: (target, name ,receiver) => {

			}
		});
	}

	get length(){
		return this.persistenceAdapter.getObjectCount();
	}

}

module.exports = ObjectProxy;