const requireFromString = require('require-from-string');
/**
 * Static methods to work with Objects.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class ObjectHelper {

	static getValueByPath(object, path){
		let pathArray = path.split('.');
	}

	static getCompiledObjectAccessor(pathDefinition) {
		let moduleString = "module.exports = (obj) => obj['" + pathDefinition.split('.').join("']['") + "']";
		return requireFromString(moduleString);
	}

}

module.exports = ObjectHelper;