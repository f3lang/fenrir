const Helper = require('../Helper');

/**
 * Holds all relevant Indices for a collection
 */
class CollectionIndices {

	/**
	 * @param collection
	 * @param {Array} indices The fields to generate indices from
	 */
	constructor(collection, indices) {
		this.idIndex = [];
		this.binaryIndices = {};
		this.cachedIndex = null;
		this.cachedBinaryIndex = null;
		let idx = indices.length;
		while (idx--) {
			this.ensureIndex(indices[idx], false);
		}
	}

	/*----------------------------------------+
	 | General Methods to work with the index |
	 +----------------------------------------*/

	/**
	 * Ensure binary index on a certain field
	 * @param {string} property - name of property to create binary index on
	 * @param {boolean} force - (Optional) flag indicating whether to construct index immediately
	 */
	ensureIndex(property, force) {
		// optional parameter to force rebuild whether flagged as dirty or not
		if (typeof (force) === 'undefined') {
			force = false;
		}
		if (property === null || property === undefined) {
			throw new Error('Attempting to set index without an associated property');
		}
		if (this.binaryIndices[property] && !force) {
			if (!this.binaryIndices[property].dirty) return;
		}
		let index = {
			'name': property,
			'dirty': true,
			'values': this.prepareFullDocIndex()
		};
		this.binaryIndices[property] = index;
		let wrappedComparer =
			(function (p, data) {
				return function (a, b) {
					let objAp = data[a][p],
						objBp = data[b][p];
					if (objAp !== objBp) {
						if (Helper.ltHelper(objAp, objBp, false)) return -1;
						if (Helper.gtHelper(objAp, objBp, false)) return 1;
					}
					return 0;
				};
			})(property, this.data);
		index.values.sort(wrappedComparer);
		index.dirty = false;
		this.dirty = true; // for autosave scenarios
	}

	ensureUniqueIndex(field) {
		let index = this.constraints.unique[field];
		if (!index) {
			// keep track of new unique index for regenerate after database (re)load.
			if (this.uniqueNames.indexOf(field) == -1) {
				this.uniqueNames.push(field);
			}
		}
		// if index already existed, (re)loading it will likely cause collisions, rebuild always
		this.constraints.unique[field] = index = new UniqueIndex(field);
		this.data.forEach(function (obj) {
			index.set(obj);
		});
		return index;
	}

	/**
	 * Ensure all binary indices
	 */
	ensureAllIndexes(force) {
		let bIndices = this.binaryIndices;
		for (let key in bIndices) {
			if (hasOwnProperty.call(bIndices, key)) {
				this.ensureIndex(key, force);
			}
		}
	}

	flagBinaryIndexesDirty() {
		let bIndices = this.binaryIndices;
		for (let key in bIndices) {
			if (hasOwnProperty.call(bIndices, key)) {
				bIndices[key].dirty = true;
			}
		}
	}

	flagBinaryIndexDirty(index) {
		if (this.binaryIndices[index]) {
			this.binaryIndices[index].dirty = true;
		}
	}


	/*---------------------+
	 | Persistence methods |
	 +---------------------*/

	serializeIndex(){

	}

	deserializeIndex(indexData){

	}

	/**
	 * Init a new Index stage. From now on changes made to the index will be recorded
	 * into a separate dataSet, which may be called by closeStage
	 * @param stageIndex
	 */
	openStage(stageIndex) {

	}

	/**
	 * This method closes the current stage and returns the changes made so far. If you commit
	 * a nextStageIndex, the next stage will be opened up immediately.
	 * @param nextStageIndex The index of the next stage
	 */
	closeStage(nextStageIndex = 0) {

	}

	applyStage(stageData){

	}
}

module.exports = CollectionIndices;