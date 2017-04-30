'use strict';

const {CALL} = require('../action-types');

module.exports = ({modelClass}) => next => action => {
	if (action.type !== CALL) {
		return next(action);
	}

	return modelClass.getCollection()
		.then(collection => {
			return collection[action.method](...action.args);
		});
};
