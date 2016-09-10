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

	before(event, handler, { priority }) {
		this.hooks.before[event].push({ handler, priority });
	}

	after(event, handler, { priority }) {
		this.hooks.after[event].push({ handler, priority });
	}

	run(place, event, args = [], context) {
		let p = Promise.resolve();

		this.hooks[place][event]
			.sort((a, b) => a.priority < b.priority)
			.forEach(({ handler }) => {
				p = p.then(ret => {
					return handler.apply(context, ret === undefined ? args : [ret]);
				});
			});

		return p;
	}
}

module.exports = Hooks;
