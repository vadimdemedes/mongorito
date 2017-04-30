'use strict';

const {call} = require('../actions');
const {LIST_INDEXES} = require('../action-types');

module.exports = ({dispatch}) => next => action => {
	if (action.type !== LIST_INDEXES) {
		return next(action);
	}

	return dispatch(call('listIndexes', action.args))
		.then(res => res.toArray());
};
