'use strict';

const isObject = require('is-plain-obj');
const mquery = require('mquery');

const convertObjectIds = require('./util/convert-object-ids');
const queryMethods = require('./util/query-methods');

class Query {
	constructor() {
		this.mquery = mquery();
	}

	find(query = {}) {
		this.where(query);

		return this.model.hooks.run('before', 'find', [], this)
			.then(() => this.model.dbCollection())
			.then(collection => {
				return new Promise((resolve, reject) => {
					this.mquery.collection(collection).find((err, docs) => {
						if (err) {
							reject(err);
							return;
						}

						resolve(docs);
					});
				});
			})
			.then(docs => this.model.hooks.run('after', 'find', [docs], this));
	}

	findOne(query = {}) {
		this.where(query);

		return this.model.hooks.run('before', 'find', [], this)
			.then(() => this.model.dbCollection())
			.then(collection => {
				return new Promise((resolve, reject) => {
					this.mquery.collection(collection).findOne((err, doc) => {
						if (err) {
							reject(err);
							return;
						}

						resolve(doc ? [doc] : []);
					});
				});
			})
			.then(docs => this.model.hooks.run('after', 'find', [docs], this))
			.then(models => models[0]);
	}

	findById(id) {
		this.where('_id', id);

		return this.model.dbCollection()
			.then(collection => {
				return new Promise((resolve, reject) => {
					this.mquery.collection(collection).findOne((err, doc) => {
						if (err) {
							reject(err);
							return;
						}

						if (!doc) {
							resolve(null);
							return;
						}

						const model = new this.model(doc); // eslint-disable-line babel/new-cap
						resolve(model);
					});
				});
			});
	}

	remove(query = {}) {
		this.where(query);

		return this.model.dbCollection()
			.then(collection => {
				return new Promise((resolve, reject) => {
					this.mquery.collection(collection).remove(err => {
						if (err) {
							reject(err);
							return;
						}

						resolve();
					});
				});
			});
	}

	count(query = {}) {
		this.where(query);

		return this.model.dbCollection()
			.then(collection => {
				return new Promise((resolve, reject) => {
					this.mquery.collection(collection).count((err, count) => {
						if (err) {
							reject(err);
							return;
						}

						resolve(count);
					});
				});
			});
	}

	include(field, value = 1) {
		if (Array.isArray(field)) {
			field.forEach(field => this.include(field));
			return this;
		}

		let select = {};

		if (isObject(field)) {
			select = field;
		}

		select[field] = value;

		this.mquery.select(select);

		return this;
	}

	exclude(field, value = 0) {
		if (Array.isArray(field)) {
			field.forEach(field => this.exclude(field));
			return this;
		}

		let select = {};

		if (isObject(field)) {
			select = field;
		}

		select[field] = value;

		this.mquery.select(select);

		return this;
	}

	sort(field, value = 'desc') {
		if (Array.isArray(field)) {
			field.forEach(field => this.sort(field));
			return this;
		}

		let sort = {};

		if (isObject(field)) {
			sort = field;
		}

		sort[field] = value;

		this.mquery.sort(sort);

		return this;
	}

	search(query) {
		return this.where({
			'$text': {
				'$search': query
			}
		});
	}

	where(key, value) {
		if (!isObject(key) && !value) {
			this.mquery.where(key);
			return this;
		}

		if (!isObject(key)) {
			return this.where({
				[key]: value
			});
		}

		this.mquery.where(convertObjectIds(key));

		return this;
	}
}

queryMethods.forEach(name => {
	Query.prototype[name] = function (...args) {
		this.mquery[name].apply(this.mquery, args);

		return this;
	};
});

module.exports = Query;
