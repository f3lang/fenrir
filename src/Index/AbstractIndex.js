/**
 * The Abstract Index parent class for every Index.
 * It offers the structure for a simple index covering one specific field in an object
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class AbstractIndex {

	constructor(collection, field){
	}

	rebuildIndex(){
	}

	addObject(object, identifier){
	}

	removeObject(identifier){
	}

	findObject(fieldData){

	}

}

module.exports = AbstractIndex;