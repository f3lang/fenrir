const Helper = require('./Helper');

/**
 * Static query operators available to create queries. Each function has a parameter a and b.
 * On function call, parameter will be the value in the collection and b the query value.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 * @author Joe Minichino <joe.minichino@gmail.com>
 */
class Operators {

	/**
	 * Compare, if the collection value absolutely matches the queried value
	 * @example
	 * // returns true
	 * $eq('1', '1');
	 * // returns false
	 * $eq('1', 1);
	 * @param {mixed} a The collection value
	 * @param {mixed} b The query value
	 * @returns {boolean} True, if the collection value equals exactly the query value
	 */
	static $eq(a, b) {
		return a === b;
	}

	/**
	 * Loosely compare the collection value to the query value.
	 * @example
	 * // returns true
	 * $eq('1', 1);
	 * @param {mixed} a The collection value
	 * @param {mixed} b The query value
	 * @returns {boolean} True, if the collection value equals loosely the query value
	 */
	static $aeq(a, b) {
		return a == b;
	}

	/**
	 * Checks, whether the collection value doesn't equal the query value.
	 * @param {mixed} a The collection value
	 * @param {mixed} b The query value
	 * @returns {boolean} True, if the collection value doesn't equal the query value
	 */
	static $ne(a, b) {
		// ecma 5 safe test for NaN
		if (b !== b) {
			// ecma 5 test value is not NaN
			return (a === a);
		}
		return a !== b;
	}

	/**
	 * Checks, if a date in the collection equals the queried date
	 * @see https://github.com/techfort/LokiJS/issues/221
	 * @param {Date} a The date in the collection
	 * @param {Date} b The date to compare to
	 * @returns {boolean} True, if the date value in the collection equals the query date
	 */
	static $dteq(a, b) {
		if (Helper.ltHelper(a, b, false)) {
			return false;
		}
		return !Helper.gtHelper(a, b, false);
	}

	/**
	 * Checks if the collection value is greater than the query value
	 * @param {mixed} a The value in the collection
	 * @param {mixed} b The query value
	 * @returns {boolean} True, if the value in the collection is greater than the query value
	 */
	static $gt(a, b) {
		return Helper.gtHelper(a, b, false);
	}

	/**
	 * Checks if the collection value is greater than or equal to the query value
	 * @param {mixed} a The value in the collection
	 * @param {mixed} b The query value
	 * @returns {boolean} True, if the value in the collection is greater or equal than the query value
	 */
	static $gte(a, b) {
		return Helper.gtHelper(a, b, true);
	}

	/**
	 * Checks if the collection value is less than the query value
	 * @param {mixed} a The value in the collection
	 * @param {mixed} b The query value
	 * @returns {boolean} True, if the value in the collection is less than the query value
	 */
	static $lt(a, b) {
		return Helper.ltHelper(a, b, false);
	}

	/**
	 * Checks if the collection value is less than or equal to the query value
	 * @param {mixed} a The value in the collection
	 * @param {mixed} b The query value
	 * @returns {boolean} True, if the value in the collection is less than or equal to the query value
	 */
	static $lte(a, b) {
		return Helper.ltHelper(a, b, true);
	}

	/**
	 * Checks if the collection value is in between the two values given in vals.
	 * @example
	 * // returns true
	 * $between(2, [1, 10]);
	 * @param {mixed} a The value in the collection
	 * @param {Array} vals A query array in the form [start, end]
	 * @returns {boolean} True, if the value in the collection is between the two values queries
	 */
	static $between(a, vals) {
		if (a === undefined || a === null) return false;
		return (Helper.gtHelper(a, vals[0], true) && Helper.ltHelper(a, vals[1], true));
	}

	/**
	 * Checks if the collection value is in the Array given as a query value.
	 * @example
	 * // returns true
	 * $in('banana', ['apple', 'banana', 'kiwi'])
	 * @param {mixed} a The collection value
	 * @param {Array} b The query Array to search for a in
	 * @returns {boolean} True if the value in the collection is present in the queried values
	 */
	static $in(a, b) {
		return b.indexOf(a) !== -1;
	}

	/**
	 * Checks, if the collection value is not in the Array given as a query value
	 * @example
	 * // returns true
	 * $nin('mango', ['apple', 'banana', 'kiwi'])
	 * @param {mixed} a The collection value
	 * @param {Array} b The query Array to search for a in
	 * @returns {boolean} True if the value in the collection is not present in the queried values
	 */
	static $nin(a, b) {
		return b.indexOf(a) === -1;
	}

	/**
	 * Checks if the given object key exists in the collection object
	 * @example
	 * // returns true
	 * $keyin({fruit: 'banana'}, 'fruit');
	 * @param {Object} a The object in the Collection
	 * @param {String} b The key to search for
	 * @returns {boolean} True if the collection value contains the queried key
	 */
	static $keyin(a, b) {
		return a in b;
	}

	/**
	 * Checks if the given object key doesn't exist in the collection object
	 * @example
	 * // returns true
	 * $nkeyin({fruit: 'banana'}, 'vegetable');
	 * @param {Object} a The object in the Collection
	 * @param {String} b The key to search for
	 * @returns {boolean} True if the collection value doesn't contain the queried key
	 */
	static $nkeyin(a, b) {
		return !(a in b);
	}

	/**
	 * Checks if the collection key is defined in the query object
	 * @example
	 * // returns true
	 * $definedin('fruit', {fruit: 'banana'})
	 * @param {String} a The key of the collection to search for
	 * @param  {Object} b The Object to be searched for the key of the collection
	 * @returns {boolean} True if the query object has a property with the property path of the collection value defined
	 */
	static $definedin(a, b) {
		return b[a] !== undefined;
	}

	/**
	 * Checks if the collection key is not defined in the query object
	 * @example
	 * // returns true
	 * $undefined('vegetable', {fruit: 'banana'})
	 * @param {String} a The key of the collection to search for
	 * @param {Object} b The Object to be searched for the key of the collection
	 * @returns {boolean} True if the query object has no property with the property path of the collection value defined
	 */
	static $undefinedin(a, b) {
		return b[a] === undefined;
	}

	/**
	 * Test a query regex on the collection value
	 * @param {String} a The value in the collection
	 * @param {RegExp} b A regular expression to test
	 * @returns {boolean} True, if the regex matches the value of the collection
	 */
	static $regex(a, b) {
		return b.test(a);
	}

	/**
	 * Checks if the queried string is a substring of the collection value
	 * @param {String} a The value in the collection
	 * @param {String} b The substring to search for
	 * @returns {boolean} True if the queried string is a substring of the collection value
	 */
	static $containsString(a, b) {
		return (typeof a === 'string') && (a.indexOf(b) !== -1);
	}

	/**
	 * Checks if the collection value doesn't contain any of the query values.
	 * @param {Array} a The value in the collection
	 * @param {Array} b The values to search for
	 * @returns {boolean} True, if the collection value doesn't contain the query value.
	 */
	static $containsNone(a, b) {
		return !Operators.$containsAny(a, b);
	}

	/**
	 * Checks if the any of the query values are contained in the collection value.
	 * @param {Array} a The value in the collection
	 * @param {Array} b The values to search for
	 * @returns {boolean} True, if the query value is contained in the collection value
	 */
	static $containsAny(a, b) {
		let checkFn = Helper.containsCheckFn(a);
		if (checkFn !== null) {
			return (Array.isArray(b)) ? (b.some(checkFn)) : (checkFn(b));
		}
		return false;
	}

	/**
	 * Checks if the collection value contains every value of the query values
	 * @param {Array} a The value of the collection
	 * @param {Array} b The values to search for
	 * @returns {boolean} True if the collection values contain every value of the query values
	 */
	static $contains(a, b) {
		let checkFn = Helper.containsCheckFn(a);
		if (checkFn !== null) {
			return (Array.isArray(b)) ? (b.every(checkFn)) : (checkFn(b));
		}
		return false;
	}

	/**
	 * Checks if the collection value has a specific type
	 * @param {mixed} a The value in the collection
	 * @param {String} b The queried type
	 * @returns {boolean} True if the collection value has the queried type
	 */
	static $type(a, b) {
		let type = typeof a;
		if (type === 'object') {
			if (Array.isArray(a)) {
				type = 'array';
			} else if (a instanceof Date) {
				type = 'date';
			}
		}
		return (typeof b !== 'object') ? (type === b) : Helper.doQueryOp(type, b);
	}

	/**
	 * Checks if the collection array value has a certain length
	 * @param {Array} a The value in the collection
	 * @param {int|Object} b The queried size
	 * @returns {boolean} True if the value in the collection has the queried size
	 */
	static $size(a, b) {
		if (Array.isArray(a)) {
			return (typeof b !== 'object') ? (a.length === b) : Helper.doQueryOp(a.length, b);
		}
		return false;
	}

	/**
	 * Checks if the collection string value has a certain length
	 * @param {String} a The value in the collection
	 * @param {int|Object} b The queried size
	 * @returns {boolean} True if the value in the collection is a string and has the queried length
	 */
	static $len(a, b) {
		if (typeof a === 'string') {
			return (typeof b !== 'object') ? (a.length === b) : Helper.doQueryOp(a.length, b);
		}
		return false;
	}

	/**
	 * Queries a given function with the value of the collection.
	 * @param {mixed} a The value of the collection
	 * @param {function} b The function to test against. The
	 * @returns {boolean} True if the query function returns true
	 */
	static $where(a, b) {
		return b(a) === true;
	}

	/**
	 * Logical operator to invert the result of a nested query
	 * @param {mixed} a The value of the collection
	 * @param {mixed} b The nested query to invert
	 * @returns {boolean} The inverted result
	 */
	static $not(a, b) {
		return !Helper.doQueryOp(a, b);
	}

	/**
	 * Logically concat the result of multiple nested queries and perform a binary 'and' on the results
	 * @param {mixed} a The value in the collection
	 * @param {Array} b The nested queries to run
	 * @returns {boolean} True if all nested Queries returned true
	 */
	static $and(a, b) {
		let idx = b.length;
		while (idx--) {
			if (!Helper.doQueryOp(a, b[idx])) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Logically concat the result of multiple nested queries and perform a binary 'or' on the results
	 * @param {mixed} a The value in the collection
	 * @param {Array} b The nested queries to run
	 * @returns {boolean} True if at least one nested Queries returned true
	 */
	static $or(a, b) {
		let idx = b.length;
		while (idx--) {
			if (Helper.doQueryOp(a, b[idx])) {
				return true;
			}
		}
		return false;
	}

}

module.exports = Operators;