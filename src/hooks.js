'use strict';

const Promise = require('bluebird');

class Hooks {
	constructor() {
		this.hooks = {
			before: {
				create: [],
				update: [],
				save: [],
				remove: [],
				find: []
			},
			after: {
				create: [],
				update: [],
				save: [],
				remove: [],
				find: []
			}
		};
	}

	before(event, handler) {
		this.hooks.before[event].push(handler);
	}

	after(event, handler) {
		this.hooks.after[event].push(handler);
	}

	run(place, event, args, context) {
		return Promise
			.each(this.hooks[place][event], hook => {
				return hook.apply(context, args);
			});
	}
}

module.exports = Hooks;
