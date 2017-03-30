const Operators = require('./Operators');

/**
 * Query Helper Functions used by fenrir.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 * @author Joe Minichino <joe.minichino@gmail.com>
 */
class Helper {

	/**
	 * Helper function for determining 'less-than' conditions for ops, sorting, and binary indices.
	 * In the future we might want $lt and $gt ops to use their own functionality/helper.
	 * Since binary indices on a property might need to index [12, NaN, new Date(), Infinity], we
	 * need this function (as well as gtHelper) to always ensure one value is LT, GT, or EQ to another.
	 */
	static ltHelper(prop1, prop2, equal) {
		let cv1;
		let cv2;
		// 'falsy' and Boolean handling
		if (!prop1 || !prop2 || prop1 === true || prop2 === true) {
			if ((prop1 === true || prop1 === false) && (prop2 === true || prop2 === false)) {
				if (equal) {
					return prop1 === prop2;
				} else {
					if (prop1) {
						return false;
					} else {
						return prop2;
					}
				}
			}
			if (prop2 === undefined || prop2 === null || prop1 === true || prop2 === false) {
				return equal;
			}
			if (prop1 === undefined || prop1 === null || prop1 === false || prop2 === true) {
				return true;
			}
		}
		if (prop1 === prop2) {
			return equal;
		}
		if (prop1 < prop2) {
			return true;
		}
		if (prop1 > prop2) {
			return false;
		}
		// not strict equal nor less than nor gt so must be mixed types, convert to string and use that to compare
		cv1 = prop1.toString();
		cv2 = prop2.toString();
		if (cv1 == cv2) {
			return equal;
		}
		return cv1 < cv2;
	}

	/**
	 * Helper function to check, if one value is greater than another.
	 * @param prop1 The value supposed to be greater
	 * @param prop2 The value supposed to be smaller
	 * @param equal The value to return, if prop1 and prop2 are equal
	 * @returns {boolean|mixed} True if prop1 is greater than prop2, false if prop2 is greater than prop1 and
	 * has the value of the equal parameter, if both values are equal
	 */
	static gtHelper(prop1, prop2, equal) {
		let cv1;
		let cv2;
		// 'falsy' and Boolean handling
		if (!prop1 || !prop2 || prop1 === true || prop2 === true) {
			if ((prop1 === true || prop1 === false) && (prop2 === true || prop2 === false)) {
				if (equal) {
					return prop1 === prop2;
				} else {
					if (prop1) {
						return !prop2;
					} else {
						return false;
					}
				}
			}
			if (prop1 === undefined || prop1 === null || prop1 === false || prop2 === true) {
				return equal;
			}
			if (prop2 === undefined || prop2 === null || prop1 === true || prop2 === false) {
				return true;
			}
		}
		if (prop1 === prop2) {
			return equal;
		}
		if (prop1 > prop2) {
			return true;
		}
		if (prop1 < prop2) {
			return false;
		}
		// not strict equal nor less than nor gt so must be mixed types, convert to string and use that to compare
		cv1 = prop1.toString();
		cv2 = prop2.toString();
		if (cv1 == cv2) {
			return equal;
		}
		return cv1 > cv2;
	}

	/**
	 * @param prop1
	 * @param prop2
	 * @param desc
	 * @returns {int}
	 */
	static sortHelper(prop1, prop2, desc) {
		if (prop1 === prop2) {
			return 0;
		}
		if (Helper.ltHelper(prop1, prop2, false)) {
			return (desc) ? (1) : (-1);
		}
		if (Helper.gtHelper(prop1, prop2, false)) {
			return (desc) ? (-1) : (1);
		}
		// not lt, not gt so implied equality-- date compatible
		return 0;
	}

	/**
	 * compoundeval() - helper function for compoundsort(), performing individual object comparisons
	 *
	 * @param {Array} properties - array of property names, in order, by which to evaluate sort order
	 * @param {Object} obj1 - first object to compare
	 * @param {Object} obj2 - second object to compare
	 * @returns {int} 0, -1, or 1 to designate if identical (sortwise) or which should be first
	 */
	static compoundeval(properties, obj1, obj2) {
		let res = 0;
		let prop, field;
		for (let i = 0, len = properties.length; i < len; i++) {
			prop = properties[i];
			field = prop[0];
			res = Helper.sortHelper(obj1[field], obj2[field], prop[1]);
			if (res !== 0) {
				return res;
			}
		}
		return 0;
	}

	/**
	 * dotSubScan - helper function used for dot notation queries.
	 *
	 * @param {Object} root - object to traverse
	 * @param {Array} paths - array of properties to drill into
	 * @param {Function} fun - evaluation function to test with
	 * @param {mixed} value - comparative value to also pass to (compare) fun
	 * @param {int} poffset - index of the item in 'paths' to start the sub-scan from
	 */
	static dotSubScan(root, paths, fun, value, poffset) {
		let pathOffset = poffset || 0;
		let path = paths[pathOffset];
		if (root === undefined || root === null || !hasOwnProperty.call(root, path)) {
			return false;
		}
		let valueFound = false;
		let element = root[path];
		if (pathOffset + 1 >= paths.length) {
			// if we have already expanded out the dot notation,
			// then just evaluate the test function and value on the element
			valueFound = fun(element, value);
		} else if (Array.isArray(element)) {
			for (let index = 0, len = element.length; index < len; index += 1) {
				valueFound = Helper.dotSubScan(element[index], paths, fun, value, pathOffset + 1);
				if (valueFound === true) {
					break;
				}
			}
		} else {
			valueFound = Helper.dotSubScan(element, paths, fun, value, pathOffset + 1);
		}
		return valueFound;
	}

	static containsCheckFn(a) {
		if (typeof a === 'string' || Array.isArray(a)) {
			return function (b) {
				return a.indexOf(b) !== -1;
			};
		} else if (typeof a === 'object' && a !== null) {
			return function (b) {
				return hasOwnProperty.call(a, b);
			};
		}
		return null;
	}

	static doQueryOp(val, op) {
		for (let p in op) {
			if (hasOwnProperty.call(op, p)) {
				return Operators[p](val, op[p]);
			}
		}
		return false;
	}


	static clone(data, method) {
		if (data === null || data === undefined) {
			return null;
		}
		let cloneMethod = method || 'parse-stringify';
		let cloned;
		switch (cloneMethod) {
			case "parse-stringify":
				cloned = JSON.parse(JSON.stringify(data));
				break;
			case "shallow":
				cloned = Object.create(data.prototype || null);
				Object.keys(data).map(i => cloned[i] = data[i]);
				break;
			default:
				break;
		}
		return cloned;
	}

	static cloneObjectArray(objarray, method) {
		let i;
		let result = [];
		if (method == "parse-stringify") {
			return Helper.clone(objarray, method);
		}
		i = objarray.length;
		while (i--) {
			result.push(Helper.clone(objarray[i], method));
		}
		return result;
	}


}

module.exports = Helper;