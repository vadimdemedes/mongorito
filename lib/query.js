'use strict';

const isObject = require('is-plain-obj');
const queryMethods = require('./query-methods');

class Query {
	constructor(modelClass) {
		this.Model = modelClass;
		this.query = [];
	}

	find(query = {}) {
		if (typeof query !== 'undefined' && typeof query !== 'object') {
			throw new TypeError(`Expected \`query\` to be object or undefined, got ${typeof query}`);
		}

		this.where(query);

		return this.Model.query('find', this.query)
			.then(documents => {
				return documents.map(doc => new this.Model(doc));
			});
	}

	findOne(query = {}) {
		if (typeof query !== 'undefined' && typeof query !== 'object') {
			throw new TypeError(`Expected \`query\` to be object or undefined, got ${typeof query}`);
		}

		this.where(query);

		return this.Model.query('findOne', this.query)
			.then(doc => doc ? new this.Model(doc) : null);
	}

	findById(id) {
		if (typeof id !== 'object' && typeof id !== 'string') {
			throw new TypeError(`Expected \`id\` to be object or string, got ${typeof id}`);
		}

		this.where('_id', id);

		return this.Model.query('findOne', this.query)
			.then(doc => doc ? new this.Model(doc) : null);
	}

	remove(query = {}) {
		if (typeof query !== 'undefined' && typeof query !== 'object') {
			throw new TypeError(`Expected \`query\` to be object or undefined, got ${typeof query}`);
		}

		this.where(query);

		return this.Model.query('remove', this.query);
	}

	count(query = {}) {
		if (typeof query !== 'undefined' && typeof query !== 'object') {
			throw new TypeError(`Expected \`query\` to be object or undefined, got ${typeof query}`);
		}

		this.where(query);

		return this.Model.query('count', this.query);
	}

	include(field, value = 1) {
		if (!Array.isArray(field) && typeof field !== 'object' && typeof field !== 'string') {
			throw new TypeError(`Expected \`field\` to be array, object or string, got ${typeof field}`);
		}

		if (typeof value !== 'number') {
			throw new TypeError(`Expected \`value\` to be number, got ${typeof value}`);
		}

		if (Array.isArray(field)) {
			field.forEach(field => this.include(field));
			return this;
		}

		const select = isObject(field) ? field : {[field]: value};
		this.query.push(['select', select]);

		return this;
	}

	exclude(field, value = 0) {
		if (!Array.isArray(field) && typeof field !== 'object' && typeof field !== 'string') {
			throw new TypeError(`Expected \`field\` to be array, object or string, got ${typeof field}`);
		}

		if (typeof value !== 'number') {
			throw new TypeError(`Expected \`value\` to be number, got ${typeof value}`);
		}

		if (Array.isArray(field)) {
			field.forEach(field => this.exclude(field));
			return this;
		}

		const select = isObject(field) ? field : {[field]: value};
		this.query.push(['select', select]);

		return this;
	}

	sort(field, value = 'desc') {
		if (!Array.isArray(field) && typeof field !== 'object' && typeof field !== 'string') {
			throw new TypeError(`Expected \`field\` to be array, object or string, got ${typeof field}`);
		}

		if (typeof value !== 'string' && typeof value !== 'number') {
			throw new TypeError(`Expected \`value\` to be string or number, got ${typeof value}`);
		}

		if (Array.isArray(field)) {
			field.forEach(field => this.sort(field));
			return this;
		}

		const sort = isObject(field) ? field : {[field]: value};
		this.query.push(['sort', sort]);

		return this;
	}
}

queryMethods.forEach(name => {
	Query.prototype[name] = function (...args) {
		this.query.push([name, args]);
		return this;
	};
});

module.exports = Query;
