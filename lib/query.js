'use strict';

const isObject = require('is-plain-obj');
const mquery = require('mquery');

const queryMethods = require('../util/query-methods');
const toObjectId = require('../util/to-objectid');

function convertObjectIds(obj = {}, fields = ['_id']) {
	const newObj = Object.assign({}, obj);

	Object.keys(obj)
		.filter(key => fields.indexOf(key) >= 0)
		.forEach(key => {
			newObj[key] = toObjectId(newObj[key]);
		});

	return newObj;
}

class Query {
	constructor() {
		this.mquery = mquery();
	}

	find(query) {
		return this.model.dbCollection()
			.then(collection => {
				return new Promise((resolve, reject) => {
					this.mquery.collection(collection).find(convertObjectIds(query), (err, docs) => {
						if (err) {
							reject(err);
							return;
						}

						const models = docs.map(doc => new this.model(doc)); // eslint-disable-line babel/new-cap
						resolve(models);
					});
				});
			});
	}

	findOne(query) {
		return this.model.dbCollection()
			.then(collection => {
				return new Promise((resolve, reject) => {
					this.mquery.collection(collection).findOne(convertObjectIds(query), (err, doc) => {
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

	findById(id) {
		return this.model.dbCollection()
			.then(collection => {
				return new Promise((resolve, reject) => {
					this.mquery.collection(collection).findOne({ '_id': toObjectId(id) }, (err, doc) => {
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

	remove(query) {
		return this.model.dbCollection()
			.then(collection => {
				return new Promise((resolve, reject) => {
					this.mquery.collection(collection).remove(convertObjectIds(query), err => {
						if (err) {
							reject(err);
							return;
						}

						resolve();
					});
				});
			});
	}

	count(query) {
		return this.model.dbCollection()
			.then(collection => {
				return new Promise((resolve, reject) => {
					this.mquery.collection(collection).count(convertObjectIds(query), (err, count) => {
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
}

queryMethods.forEach(name => {
	Query.prototype[name] = function (...args) {
		this.mquery[name].apply(this.mquery, args);

		return this;
	};
});

module.exports = Query;
