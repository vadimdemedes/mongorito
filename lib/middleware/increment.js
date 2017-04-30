'use strict';

const {call, refresh} = require('../actions');
const {INCREMENT} = require('../action-types');

module.exports = ({dispatch, getState}) => next => action => {
	if (action.type !== INCREMENT) {
		return next(action);
	}

	const query = {_id: getState().fields._id};
	const options = {$inc: action.fields};

	return dispatch(call('update', [query, options]))
		.then(() => dispatch(refresh()));
};
