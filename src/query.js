'use strict';

const isObject = require('is-plain-obj');
const mquery = require('mquery');

const queryMethods = require('./util/query-methods');

class Query {
	constructor() {
		this.mquery = mquery();
	}

	find(query = {}) {
		this.where(query);

		return this.model.hooks.run('before', 'find', [], this)
			.then(() => this.model.dbCollection())
			.then(collection => this.mquery.collection(collection).find())
			.then(docs => this.model.hooks.run('after', 'find', [docs], this));
	}

	findOne(query = {}) {
		this.where(query);

		return this.model.hooks.run('before', 'find', [], this)
			.then(() => this.model.dbCollection())
			.then(collection => this.mquery.collection(collection).findOne())
			.then(doc => doc ? [doc] : [])
			.then(docs => this.model.hooks.run('after', 'find', [docs], this))
			.then(models => models[0]);
	}

	findById(id) {
		this.where('_id', id);

		return this.model.dbCollection()
			.then(collection => this.mquery.collection(collection).findOne())
			.then(doc => doc ? new this.model(doc) : null); // eslint-disable-line babel/new-cap
	}

	remove(query = {}) {
		this.where(query);

		return this.model.dbCollection()
			.then(collection => this.mquery.collection(collection).remove());
	}

	count(query = {}) {
		this.where(query);

		return this.model.dbCollection()
			.then(collection => this.mquery.collection(collection).count());
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
}

queryMethods.forEach(name => {
	Query.prototype[name] = function (...args) {
		this.mquery[name].apply(this.mquery, args);

		return this;
	};
});

module.exports = Query;
