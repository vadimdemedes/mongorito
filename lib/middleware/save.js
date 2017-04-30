'use strict';

const serialize = require('../serialize');
const {create, update} = require('../actions');
const {SAVE} = require('../action-types');

module.exports = ({dispatch, getState}) => next => action => {
	if (action.type !== SAVE) {
		return next(action);
	}

	action.fields = serialize(action.fields);

	const isCreated = Boolean(getState().fields._id);

	return dispatch(isCreated ? update(action.fields) : create(action.fields));
};
