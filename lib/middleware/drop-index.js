'use strict';

const {call} = require('../actions');
const {DROP_INDEX} = require('../action-types');

module.exports = ({dispatch}) => next => action => {
	if (action.type !== DROP_INDEX) {
		return next(action);
	}

	return dispatch(call('dropIndex', action.args));
};
