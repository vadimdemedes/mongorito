'use strict';

const mquery = require('mquery');
const arrify = require('arrify');
const {QUERY} = require('../action-types');

module.exports = store => next => action => {
	if (action.type !== QUERY) {
		return next(action);
	}

	const model = store.modelClass;

	return model.getCollection()
		.then(collection => {
			const query = mquery();

			action.query.forEach(call => {
				const [method, args] = call;
				query[method](...arrify(args));
			});

			return query.collection(collection)[action.method]();
		});
};
