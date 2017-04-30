'use strict';

const dotProp = require('dot-prop');
const merge = require('lodash.merge');
const omit = require('lodash.omit');
const ActionTypes = require('../action-types');

module.exports = (state = {}, action) => {
	switch (action.type) {
		case ActionTypes.SET:
			return merge(state, action.fields);

		case ActionTypes.UNSET: {
			const newState = Object.assign({}, state);

			action.keys.forEach(key => {
				dotProp.delete(newState, key);
			});

			return newState;
		}

		case ActionTypes.CREATED:
			return Object.assign({}, state, {_id: action.id});

		case ActionTypes.REMOVED:
			return omit(state, '_id');

		case ActionTypes.REFRESHED:
			return action.fields;

		default:
			return state;
	}
};
