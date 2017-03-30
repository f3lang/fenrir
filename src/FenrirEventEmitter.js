/**
 * FenrirEventEmitter is a minimalist version of an Event Emitter. It enables any
 * constructor that inherits EventEmitter to emit events and trigger
 * listeners that have been added to the event through the on(event, callback) method.
 * It is based on the LokiEventEmitter
 * @see https://github.com/techfort/LokiJS
 * @abstract
 */
class FenrirEventEmitter {

	constructor() {
		/**
		 * A hashmap, with each property being an array of callbacks
		 */
		this.events = {};
		/**
		 * Determines whether or not the callbacks associated with each event
		 * should happen in an async fashion or not
		 * Default is false, which means events are synchronous
		 * @type {boolean}
		 */
		this.asyncListeners = false;
		/**
		 * Alias of FenrirEventEmitter.on
		 */
		this.addListener = this.on;
	}

	/**
	 * on(eventName, listener) - Adds a listener to the queue of callbacks associated to an event
	 * @param {string|string[]} eventName - The name(s) of the event(s) to listen to
	 * @param {function} listener - Callback function of listener to attach
	 * @returns {function} The callback itself
	 */
	on(eventName, listener) {
		if (Array.isArray(eventName)) {
			//map is faster then forEach:
			eventName.map(currentEventName => this.on(currentEventName, listener));
			return listener;
		}
		let event = this.events[eventName];
		if (!event) {
			event = this.events[eventName] = [];
		}
		event.push(listener);
		return listener;
	}

	/**
	 * emit(eventName, data) - emits a particular event with the option of passing optional parameters which are going
	 * to be processed by the callback provided signatures match (i.e. if passing emit(event, arg0, arg1)
	 * the listener should take two parameters)
	 * @param {string} eventName - The name of the event to emit
	 * @param {object=} data - Optional objects passed with the event
	 */
	emit(eventName, ...data) {
		if (eventName && this.events[eventName]) {
			this.events[eventName].map(listener => {
				if (this.asyncListeners) {
					process.nextTick(() => listener(...data));
				} else {
					listener(...data);
				}
			});
		} else {
			throw new Error('No event ' + eventName + ' defined');
		}
	};

	/**
	 * removeListener() - removes the listener at position 'index' from the event 'eventName'
	 * @param {string|string[]} eventName - the name(s) of the event(s) which the listener is attached to
	 * @param {function} listener - the listener callback function to remove from emitter
	 */
	removeListener(eventName, listener) {
		if (Array.isArray(eventName)) {
			return eventName.map(currentEventName => this.removeListener(currentEventName, listener));
		}
		if (this.events[eventName]) {
			let listeners = this.events[eventName];
			listeners.splice(listeners.indexOf(listener), 1);
		}
	}

}

module.exports = FenrirEventEmitter;
