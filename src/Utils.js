/**
 * General utility class for fenrir.
 * Include:
 * - statistical functions
 * - object manipulation functions
 */
class Utils {

	static copyProperties(src, dest) {
		Object.assign(dest, src);
	}

	// used to recursively scan hierarchical transform step object for param substitution
	static resolveTransformObject(subObj, params, depth) {
		let prop;
		let pname;
		if (typeof depth !== 'number') {
			depth = 0;
		}
		if (++depth >= 10) return subObj;
		for (prop in subObj) {
			if (typeof subObj[prop] === 'string' && subObj[prop].indexOf("[%lktxp]") === 0) {
				pname = subObj[prop].substring(8);
				if (params.hasOwnProperty(pname)) {
					subObj[prop] = params[pname];
				}
			} else if (typeof subObj[prop] === "object") {
				subObj[prop] = Utils.resolveTransformObject(subObj[prop], params, depth);
			}
		}
		return subObj;
	}

	// top level utility to resolve an entire (single) transform (array of steps) for parameter substitution
	static resolveTransformParams(transform, params) {
		let idx;
		let clonedStep;
		let resolvedTransform = [];
		if (typeof params === 'undefined') return transform;
		// iterate all steps in the transform array
		for (idx = 0; idx < transform.length; idx++) {
			// clone transform so our scan and replace can operate directly on cloned transform
			clonedStep = JSON.parse(JSON.stringify(transform[idx]));
			resolvedTransform.push(Utils.resolveTransformObject(clonedStep, params));
		}
		return resolvedTransform;
	}

	static isDeepProperty(field) {
		return field.indexOf('.') !== -1;
	}

	static parseBase10(num) {
		return parseFloat(num);
	}

	static isNotUndefined(obj) {
		return obj !== undefined;
	}

	static add(a, b) {
		return a + b;
	}

	static sub(a, b) {
		return a - b;
	}

	static median(values) {
		values.sort(Utils.sub);
		let half = Math.floor(values.length / 2);
		return (values.length % 2) ? values[half] : ((values[half - 1] + values[half]) / 2.0);
	}

	static average(array) {
		return (array.reduce(add, 0)) / array.length;
	}

	static standardDeviation(values) {
		let avg = Utils.average(values);
		let squareDiffs = values.map(function (value) {
			let diff = value - avg;
			return diff * diff;
		});
		let avgSquareDiff = Utils.average(squareDiffs);
		return Math.sqrt(avgSquareDiff);
	}

	static deepProperty(obj, property, isDeep) {
		if (isDeep === false) {
			// pass without processing
			return obj[property];
		}
		let pieces = property.split('.');
		let root = obj;
		while (pieces.length > 0) {
			root = root[pieces.shift()];
		}
		return root;
	}

	static binarySearch(array, item, fun) {
		let lo = 0;
		let hi = array.length;
		let compared;
		let mid;
		while (lo < hi) {
			mid = (lo + hi) >> 1;
			compared = fun.apply(null, [item, array[mid]]);
			if (compared === 0) {
				return {
					found: true,
					index: mid
				};
			} else if (compared < 0) {
				hi = mid;
			} else {
				lo = mid + 1;
			}
		}
		return {
			found: false,
			index: hi
		};
	}

	static BSonSort(fun) {
		return function (array, item) {
			return Utils.binarySearch(array, item, fun);
		};
	}

}

module.exports = Utils;