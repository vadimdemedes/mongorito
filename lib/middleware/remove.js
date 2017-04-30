'use strict';

const {call} = require('../actions');
const {REMOVE, REMOVED} = require('../action-types');

module.exports = ({dispatch, getState}) => next => action => {
	if (action.type !== REMOVE) {
		return next(action);
	}

	const {_id} = getState().fields;

	return dispatch(call('remove', [{_id}]))
		.then(() => dispatch({type: REMOVED}));
};
