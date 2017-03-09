/**
 * The Object Proxy is a proxy for the data object in a collection.
 */
class ObjectProxy extends Proxy {

	constructor(original, persistenceAdapter) {
		this.persistenceAdapter = persistenceAdapter;
		this.dataContainer = {};
		super(original, {
			get: (target, name, receiver) => {
				return this.dataContainer[name] ? this.dataContainer[name] : this.persistenceAdapter.getObject(name);
			},
			set: (target, name, value) => {
				this.dataContainer[name] = value.toUpperCase();
			}
		});
	}

	get length(){
		return this.persistenceAdapter.getObjectCount();
	}

}

class PersistenceAdapter {
	static getObjectCount(){
		return 5;
	}

	static getObject(identifier){
		return "blubb" + identifier;
	}
}


let pa = new PersistenceAdapter();
let op = new ObjectProxy({}, pa);

console.log(op['test']);
op['test'] = "neuerTest";
console.log(op['test']);