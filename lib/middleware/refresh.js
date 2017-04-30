'use strict';

const {query} = require('../actions');
const {REFRESH, REFRESHED} = require('../action-types');

module.exports = ({dispatch, getState}) => next => action => {
	if (action.type !== REFRESH) {
		return next(action);
	}

	const {_id} = getState().fields;

	return dispatch(query('findOne', [['where', {_id}]]))
		.then(fields => dispatch({type: REFRESHED, fields}));
};
