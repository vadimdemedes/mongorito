'use strict';

const {call} = require('../actions');
const {CREATE, CREATED} = require('../action-types');

module.exports = ({dispatch}) => next => action => {
	if (action.type !== CREATE) {
		return next(action);
	}

	return dispatch(call('insert', [action.fields]))
		.then(inserted => {
			return dispatch({
				type: CREATED,
				id: inserted.ops[0]._id
			});
		});
};
