'use strict';

const ActionTypes = require('../action-types');

module.exports = (state = [], action) => {
	switch (action.type) {
		case ActionTypes.UNSET:
			return [...state, ...action.keys];

		case ActionTypes.UPDATED:
			return [];

		default:
			return state;
	}
};
