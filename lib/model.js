'use strict';

const pluralize = require('pluralize');
const isObject = require('is-plain-obj');
const result = require('lodash.result');
const arrify = require('arrify');
const get = require('get-value');
const set = require('set-value');

const queryMethods = require('../util/query-methods');
const flatten = require('../util/join-obj-keys');
const Query = require('./query');

class Fields {
	constructor(fields = {}) {
		this.fields = {};
		this.set(fields);
	}

	get(key) {
		return key ? get(this.fields, key) : this.fields;
	}

	set(key, value) {
		if (isObject(key)) {
			const obj = flatten(key);

			Object.keys(obj).forEach(key => {
				this.set(key, obj[key]);
			});

			return;
		}

		set(this.fields, key, value);
	}

	unset(key = []) {
		arrify(key).forEach(key => {
			delete this.fields[key];
		});
	}

	clear() {
		this.fields = {};
	}
}

class Model {
	constructor(fields = {}) {
		const defaultFields = this.constructor.defaultFields;

		this.fields = new Fields(Object.assign({}, flatten(defaultFields), flatten(fields)));
		this.previous = new Fields();
	}

	get(key) {
		return this.fields.get(key);
	}

	set(key, value) {
		if (isObject(key)) {
			const obj = flatten(key);

			Object.keys(obj).forEach(key => {
				this.set(key, obj[key]);
			});

			return;
		}

		const previousValue = this.fields.get(key);

		if (previousValue !== value) {
			if (typeof previousValue !== 'undefined') {
				this.previous.set(key, previousValue);
			}

			this.fields.set(key, value);
		}
	}

	unset(keys = []) {
		const unsetKeys = {};

		arrify(keys).forEach(key => {
			unsetKeys[key] = '';
		});

		return this.constructor.dbCollection()
			.then(collection => {
				return collection.update({ _id: this.get('_id') }, { '$unset': unsetKeys });
			})
			.then(() => {
				this.fields.unset(keys);
			});
	}

	changed(key) {
		return this.fields.get(key) !== this.previous.get(key);
	}

	toJSON() {
		return this.get();
	}

	save() {
		const isSaved = Boolean(this.get('_id'));

		if (isSaved) {
			return this.update();
		} else {
			return this.create();
		}
	}

	create() {
		this.set('created_at', new Date());
		this.set('updated_at', new Date());

		return this.constructor.dbCollection()
			.then(collection => {
				return collection.insert(this.get());
			})
			.then(inserted => {
				this.set('_id', inserted.ops[0]._id);
			});
	}

	update() {
		this.set('updated_at', new Date());

		return this.constructor.dbCollection()
			.then(collection => {
				return collection.update({ _id: this.get('_id') }, this.get());
			});
	}

	inc(key, value = 1) {
		const isSaved = Boolean(this.get('_id'));

		if (!isSaved) {
			return Promise.reject(new Error('Attribute can\'t be incremented in unsaved model.'));
		}

		this.set('updated_at', new Date());

		let fields;

		if (isObject(key)) {
			fields = key;
		} else {
			fields = {
				[key]: value
			};
		}

		return this.constructor.dbCollection()
			.then(collection => {
				return collection.update({ _id: this.get('_id') }, { '$inc': fields, '$set': { 'updated_at': this.get('updated_at') } });
			})
			.then(() => {
				return this.refresh();
			});
	}

	refresh() {
		const isSaved = Boolean(this.get('_id'));

		if (!isSaved) {
			return Promise.reject(new Error('Unsaved model can\'t be refreshed.'));
		}

		return this.constructor.dbCollection()
			.then(collection => {
				return collection.findOne({ _id: this.get('_id') });
			})
			.then(fields => {
				this.set(fields);
			});
	}

	remove() {
		const isSaved = Boolean(this.get('_id'));

		if (!isSaved) {
			return Promise.reject(new Error('Unsaved model can\'t be removed.'));
		}

		return this.constructor.dbCollection()
			.then(collection => {
				return collection.remove({ _id: this.get('_id') });
			});
	}
}

Model.connection = function () {
	if (!this.database) {
		return Promise.reject(new Error('Model is not registered in a database.'));
	}

	return this.database.connection();
};

Model.dbCollection = function () {
	return this.connection()
		.then(db => {
			const name = result(this, 'collection');

			return db.collection(name);
		});
};

Model.collection = function () {
	return pluralize(this.displayName || this.name).toLowerCase();
};

Model.find = function (...args) {
	const query = new Query();
	query.model = this;
	return query.find(...args);
};

Model.findOne = function (...args) {
	const query = new Query();
	query.model = this;
	return query.findOne(...args);
};

Model.remove = function (...args) {
	const query = new Query();
	query.model = this;
	return query.remove(...args);
};

Model.count = function (...args) {
	const query = new Query();
	query.model = this;
	return query.count(...args);
};

queryMethods.forEach(name => {
	Model[name] = function (...args) {
		const query = new Query();
		query.model = this;
		return query[name].apply(query, args);
	};
});

module.exports = Model;
