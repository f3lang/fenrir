/**
 * The Abstract Data Provider is the base class for every class that is used to retrieve
 * data from the database. It offers chainable function to perform queries, filters,
 * map reduces etc.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class AbstractDataProvider {

	constructor() {
		if (new.target === AbstractDataProvider) {
			throw new TypeError("Cannot use AbstractDataProvider directly. Use a derived class.");
		}
	}

	/**
	 * Returns the data of the current Data Provider
	 * @return Array
	 */
	data(){
	}

	/**
	 * Executes a query on the Data Provider.
	 * @param query object The Query to perform on this Data Provider. See the query documentation for details.
	 * @param keep boolean If true, the result is forced to keep in sync with this Data Provider.
	 * Set true to create a custom view on this Data Provider.
	 * @return AbstractDataProvider A new Data Provider with the result of the query
	 */
	find(query, keep = false) {
	}

	/**
	 * Finds a single document in this Data Provider
	 * @param query The query to use. See the query documentation for details.
	 */
	findOne(query) {
	}

	filter(filter) {

	}

	count() {

	}

	get(id) {

	}

}

module.exports = AbstractDataProvider;