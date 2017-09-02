define(() => {
	'use strict';

	return class EventObject {
		constructor() {
			this.listeners = new Map();
			this.forwards = new Set();
		}

		addEventListener(type, callback) {
			const l = this.listeners.get(type);
			if(l) {
				l.push(callback);
			} else {
				this.listeners.set(type, [callback]);
			}
		}

		removeEventListener(type, fn) {
			const l = this.listeners.get(type);
			if(!l) {
				return;
			}
			const i = l.indexOf(fn);
			if(i !== -1) {
				l.splice(i, 1);
			}
		}

		countEventListeners(type) {
			return (this.listeners.get(type) || []).length;
		}

		removeAllEventListeners(type) {
			if(type) {
				this.listeners.delete(type);
			} else {
				this.listeners.clear();
			}
		}

		addEventForwarding(target) {
			this.forwards.add(target);
		}

		removeEventForwarding(target) {
			this.forwards.delete(target);
		}

		removeAllEventForwardings() {
			this.forwards.clear();
		}

		trigger(type, params = []) {
			(this.listeners.get(type) || []).forEach(
				(listener) => listener.apply(null, params)
			);
			this.forwards.forEach((fwd) => fwd.trigger(type, params));
		}
	};
});
