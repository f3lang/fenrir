/**
 * The performance management and optimization in fenrir is organized with an optimistic approach,
 * we don't need to use fixed objects and wait for the end of synchronous calls on each query.
 * Queries should run pretty much on their own and be supported by the performance and cache manager
 * classes if it is possible. The data exchange to those managers is therefore organized over an
 * asynchronous bus system. At the moment, the query is generated, executed and finalized, the query
 * emits events on the bus system to inform the performance and cache managers about data to optimize.
 *
 * This class is the base bus to be extended by other buses for each usecase.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class AbstractBus {

	constructor() {
		this.subscribers = {};
	}

	/**
	 * Submits a data package to the bus system. The bus then notifies the connected manager classes of the new data.
	 * This method works as a fire and forget. It returns a Promise, which is fulfilled as soon, as all subscribers
	 * received the submitted data.
	 * @param target The target manager class to send the data package to
	 * @param description The description of the data submitted to the bus
	 * @param data The data itself
	 */
	submit(target, description, data) {
		return new Promise((resolve, reject) => {
				this.subscribers.map(subscriber => {
					subscriber.notify(description, data);
				});
			}
		)

	}

	/**
	 * Subscribes a Listener on this bus. The Listener needs to extend the AbstractBusSubscriber class.
	 * @param target The target to subscribe to
	 * @param subscriber The subscriber itself
	 */
	subscribe(target, subscriber) {
		this.subscribers[target] = this.subscribers[target] || [];
		this.subscribers[target].push(subscriber);
	}


}

module.exports = AbstractBus;