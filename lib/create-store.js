'use strict';

const {createStore, combineReducers, applyMiddleware} = require('redux');
const arrify = require('arrify');
const createIndexMiddleware = require('./middleware/create-index');
const dropIndexMiddleware = require('./middleware/drop-index');
const listIndexesMiddleware = require('./middleware/list-indexes');
const incrementMiddleware = require('./middleware/increment');
const refreshMiddleware = require('./middleware/refresh');
const createMiddleware = require('./middleware/create');
const updateMiddleware = require('./middleware/update');
const removeMiddleware = require('./middleware/remove');
const saveMiddleware = require('./middleware/save');
const queryMiddleware = require('./middleware/query');
const getMiddleware = require('./middleware/get');
const setMiddleware = require('./middleware/set');
const callMiddleware = require('./middleware/call');
const unsetFieldsReducer = require('./reducers/unset-fields');
const fieldsReducer = require('./reducers/fields');

const defaultReducer = {
	unset: unsetFieldsReducer,
	fields: fieldsReducer
};

const defaultMiddleware = [
	incrementMiddleware,
	refreshMiddleware,
	getMiddleware,
	setMiddleware,
	updateMiddleware,
	createMiddleware,
	saveMiddleware,
	removeMiddleware,
	callMiddleware,
	queryMiddleware,
	createIndexMiddleware,
	dropIndexMiddleware,
	listIndexesMiddleware
];

module.exports = ({model, modelClass}) => {
	let reducer = defaultReducer;
	arrify(modelClass.customReducers).forEach(customReducer => {
		reducer = customReducer(reducer);
	});

	const internalMiddleware = store => {
		store.model = model;
		store.modelClass = modelClass;

		return next => action => next(action);
	};

	const middleware = [internalMiddleware]
		.concat(modelClass.middleware || [])
		.concat(defaultMiddleware);

	return createStore(combineReducers(reducer), applyMiddleware(...middleware));
};
