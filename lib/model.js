'use strict';

const isObject = require('is-plain-obj');
const result = require('lodash.result');
const arrify = require('arrify');
const get = require('get-value');
const set = require('set-value');

const joinKeys = require('../util/join-obj-keys');

class Attributes {
	constructor(attrs = {}) {
		this.attrs = attrs;
	}

	get(key) {
		return key ? get(this.attrs, key) : this.attrs;
	}

	set(key, value) {
		if (isObject(key)) {
			const obj = joinKeys(key);

			Object.keys(obj).forEach(key => {
				this.set(key, obj[key]);
			});

			return;
		}

		set(this.attrs, key, value);
	}

	unset(key = []) {
		arrify(key).forEach(key => {
			delete this.attrs[key];
		});
	}
}

class Model {
	constructor(attrs = {}) {
		this.attrs = new Attributes(attrs);
		this.previous = new Attributes();
	}

	get(key) {
		return this.attrs.get(key);
	}

	set(key, value) {
		if (isObject(key)) {
			const obj = joinKeys(key);

			Object.keys(obj).forEach(key => {
				this.set(key, obj[key]);
			});

			return;
		}

		const previousValue = this.attrs.get(key);

		if (previousValue !== value) {
			this.previous.set(key, previousValue);
			this.attrs.set(key, value);
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
				this.attrs.unset(keys);
			});
	}

	changed(key) {
		return this.attrs.get(key) !== this.previous.get(key);
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
		return this.constructor.dbCollection()
			.then(collection => {
				return collection.insert(this.get());
			})
			.then(inserted => {
				this.set('_id', inserted.ops[0]._id);
			});
	}

	update() {
		return this.constructor.dbCollection()
			.then(collection => {
				return collection.update({ _id: this.get('_id') }, this.get());
			});
	}

	inc(key, value = 1) {
		const isSaved = Boolean(this.get('_id'));

		if (!isSaved) {
			throw new Error('Attribute can\'t be incremented in unsaved model.');
		}

		let attrs;

		if (isObject(key)) {
			attrs = key;
		} else {
			attrs = {
				[key]: value
			};
		}

		return this.constructor.dbCollection()
			.then(collection => {
				return collection.update({ _id: this.get('_id') }, { '$inc': attrs });
			})
			.then(() => {
				return this.refresh();
			});
	}

	refresh() {
		const isSaved = Boolean(this.get('_id'));

		if (!isSaved) {
			throw new Error('Unsaved model can\'t be refreshed.');
		}

		return this.constructor.dbCollection()
			.then(collection => {
				return collection.findOne({ _id: this.get('_id') });
			})
			.then(attrs => {
				this.set(attrs);
			});
	}
}

Model.connection = function () {
	if (!this.database) {
		throw new Error('Model is not registered in a database.');
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
	return this.displayName || this.name;
};

module.exports = Model;
