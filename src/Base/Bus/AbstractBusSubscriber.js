/**
 * The Base class for subscribers to instances of the AbstractBus
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class AbstractBusSubscriber {

	constructor() {

	}

	/**
	 * Notifies the subscriber about a new data package.
	 * @param description
	 * @param data
	 * @returns {Promise}
	 */
	notify(description, data) {
		return new Promise((resolve ,reject) => {
			if (this.prototype.hasOwnProperty(description)) {
				resolve(this[description](...data));
			} else {
				reject("no method available");
			}
		});
	}

}

module.exports = AbstractBusSubscriber;