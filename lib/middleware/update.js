'use strict';

const {call} = require('../actions');
const {UPDATE, UPDATED} = require('../action-types');

module.exports = ({dispatch, getState}) => next => action => {
	if (action.type !== UPDATE) {
		return next(action);
	}

	const {unset, fields: {_id}} = getState();
	const {fields} = action;

	const unsetFields = {};
	unset.forEach(key => {
		unsetFields[key] = '';
	});

	const query = {_id};

	const unsetCall = call('update', [query, {$unset: unsetFields}]);
	const unsetPromise = unset.length > 0 ? dispatch(unsetCall) : Promise.resolve();

	return unsetPromise
		.then(() => dispatch(call('update', [query, {$set: fields}])))
		.then(() => dispatch({type: UPDATED, fields}));
};
