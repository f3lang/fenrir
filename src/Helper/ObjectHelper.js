const requireFromString = require('require-from-string');
/**
 * Static methods to work with Objects.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class ObjectHelper {

	/**
	 * Returns a compiled module for accessing a property of objects natively.
	 * This is has a huge performance advantage over iterating through the
	 * properties of an object recursively. It creates the object access code
	 * and compiles it. Be careful when using this method just once. Compiling
	 * is very time consuming. So it is mesmerizing fast when you reuse the compiled
	 * module over and over again, but it will be painful slow if you recompile
	 * ist every time when you need dynamic access to an object.
	 * Supports dot notation for nested objects.
	 *
	 * e.g. if you request an accessor with the pathDefinition "address.city.zipCode",
	 * this method will create the following code:
	 * module.exports = (obj) => obj['address']['city']['zipCode']
	 * This code is compiled to a node module and you can use it directly. This is nearly
	 * as fast as directly calling "obj['address']['city']['zipCode']"
	 * uses the require-from-string module.
	 *
	 * @param {String} pathDefinition The path to access. e.g. "address.city.zipCode"
	 * @returns {*} Tha value of the object under the pathDefinition
	 */
	static getCompiledObjectAccessor(pathDefinition) {
		let moduleString = "module.exports = (obj) => obj['" + pathDefinition.split('.').join("']['") + "']";
		return requireFromString(moduleString);
	}

}

module.exports = ObjectHelper;