'use strict';

const dotProp = require('dot-prop');
const {GET} = require('../action-types');

module.exports = store => next => action => {
	if (action.type !== GET) {
		return next(action);
	}

	const {fields} = store.getState();
	const {key} = action;

	return key ? dotProp.get(fields, key) : Object.assign({}, fields);
};
