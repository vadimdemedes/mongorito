'use strict';

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

	before(event, handler, options) {
		if (!options) {
			options = {};
		}

		this.hooks.before[event].push({
			handler,
			priority: options.priority
		});
	}

	after(event, handler, options) {
		if (!options) {
			options = {};
		}

		this.hooks.after[event].push({
			handler,
			priority: options.priority
		});
	}

	run(place, event, args, context) {
		if (!args) {
			args = [];
		}

		let p = Promise.resolve();

		this.hooks[place][event]
			.sort((a, b) => a.priority < b.priority)
			.forEach(hook => {
				p = p.then(ret => {
					return hook.handler.apply(context, ret === undefined ? args : [ret]);
				});
			});

		return p;
	}
}

module.exports = Hooks;
