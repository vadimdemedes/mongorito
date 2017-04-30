'use strict';

const {call} = require('../actions');
const {CREATE_INDEX} = require('../action-types');

module.exports = ({dispatch}) => next => action => {
	if (action.type !== CREATE_INDEX) {
		return next(action);
	}

	return dispatch(call('createIndex', action.args));
};
