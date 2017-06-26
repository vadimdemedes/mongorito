'use strict';

const pluralize = require('pluralize');
const result = require('lodash.result');
const arrify = require('arrify');
const dotProp = require('dot-prop');
const createStore = require('./create-store');
const queryMethods = require('./query-methods');
const serialize = require('./serialize');
const Query = require('./query');
const {
	get,
	set,
	unset,
	save,
	refresh,
	remove,
	increment,
	createIndex,
	dropIndex,
	listIndexes,
	query
} = require('./actions');

function Model(fields) {
	const modelClass = this.constructor;

	this.store = createStore({modelClass, model: this});

	const initialFields = Object.assign({}, modelClass.defaultFields, fields);
	this.set(initialFields);
}

Model.prototype.collection = function () {
	return pluralize(this.constructor.displayName || this.constructor.name).toLowerCase();
};

Model.prototype.getConnection = function () {
	return this.constructor.getConnection();
};

Model.prototype.getCollection = function () {
	return this.constructor.getCollection();
};

Model.prototype.get = function (key) {
	if (typeof key !== 'undefined' && typeof key !== 'string') {
		throw new TypeError(`Expected \`key\` to be string or undefined, not ${typeof key}`);
	}

	return this.store.dispatch(get(key));
};

Model.prototype.set = function (key, value) {
	if (typeof key !== 'object' && typeof key !== 'string') {
		throw new TypeError(`Expected \`key\` to be string or object, not ${typeof key}`);
	}

	const fields = {};

	if (typeof key === 'object') {
		Object.assign(fields, key);
	} else {
		dotProp.set(fields, key, value);
	}

	this.store.dispatch(set(fields));
};

Model.prototype.unset = function (keys = []) {
	if (!Array.isArray(keys) && typeof keys !== 'string') {
		throw new TypeError(`Expected \`keys\` to be string or array, not ${typeof keys}`);
	}

	this.store.dispatch(unset(arrify(keys)));
};

Model.prototype.toJSON = Model.prototype.toBSON = function () {
	return serialize(this.get());
};

Model.prototype.isSaved = function () {
	return Boolean(this.get('_id'));
};

Model.prototype.refresh = function () {
	return this.store.dispatch(refresh());
};

Model.prototype.save = function () {
	const fields = Object.assign({}, this.store.getState().fields);

	return this.store.dispatch(save(fields));
};

Model.prototype.remove = function () {
	if (!this.isSaved()) {
		throw new Error('Can\'t remove an unsaved model');
	}

	return this.store.dispatch(remove());
};

Model.prototype.increment = function (key, value = 1) {
	if (typeof key !== 'string' && typeof key !== 'object') {
		throw new TypeError(`Expected \`key\` to be string or object, not ${typeof key}`);
	}

	if (!this.isSaved()) {
		throw new Error('Can\'t execute an increment on unsaved model');
	}

	const fields = {};

	if (typeof key === 'object') {
		Object.assign(fields, key);
	} else {
		dotProp.set(fields, key, value);
	}

	return this.store.dispatch(increment(fields));
};

Model.getConnection = function () {
	if (!this.database) {
		return Promise.reject(new Error('Model is not registered in a database.'));
	}

	return this.database.connection();
};

Model.getCollection = function () {
	return this.getConnection()
		.then(db => {
			const name = result(this.prototype, 'collection');

			return db.collection(name);
		});
};

Model.use = function (plugins) {
	if (!Array.isArray(plugins) && typeof plugins !== 'function') {
		throw new TypeError(`Expected \`plugins\` to be function or array, not ${typeof plugins}`);
	}

	if (!this.middleware) {
		this.middleware = [];
	}

	arrify(plugins).forEach(plugin => {
		const middleware = plugin(this);

		if (typeof middleware === 'function') {
			this.middleware.push(middleware);
		}
	});
};

Model.modifyReducer = function (reducer) {
	if (typeof reducer !== 'function') {
		throw new TypeError(`Expected \`reducer\` to be function, not ${typeof reducer}`);
	}

	if (!this.customReducers) {
		this.customReducers = [];
	}

	this.customReducers.push(reducer);
};

Model.query = function (method, q) {
	const store = createStore({modelClass: this});

	return store.dispatch(query(method, q));
};

Model.createIndex = function (...args) {
	const store = createStore({modelClass: this});

	return store.dispatch(createIndex(args));
};

Model.dropIndex = function (...args) {
	const store = createStore({modelClass: this});

	return store.dispatch(dropIndex(args));
};

Model.listIndexes = function (...args) {
	const store = createStore({modelClass: this});

	return store.dispatch(listIndexes(args));
};

Model.embeds = function (key, model) {
	if (!this.embeddedModels) {
		this.embeddedModels = [];
	}

	this.embeddedModels.push({key, model});
};

const methods = [
	'find',
	'findOne',
	'findById',
	'count',
	'sort',
	'include',
	'exclude',
	'remove'
].concat(queryMethods);

methods.forEach(method => {
	Model[method] = function (...args) {
		const query = new Query(this);
		return query[method](...args);
	};
});

module.exports = Model;
