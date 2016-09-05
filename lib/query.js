'use strict';

const mquery = require('mquery');

const queryMethods = require('../util/query-methods');

class Query {
	constructor() {
		this.mquery = mquery();
	}

	find(query) {
		return this.model.dbCollection()
			.then(collection => {
				return new Promise((resolve, reject) => {
					this.mquery.collection(collection).find(query, (err, docs) => {
						if (err) {
							reject(err);
							return;
						}

						const models = docs.map(doc => new this.model(doc));
						resolve(models);
					});
				});
			});
	}

	remove(query) {
		return this.model.dbCollection()
			.then(collection => {
				return new Promise((resolve, reject) => {
					this.mquery.collection(collection).remove(query, err => {
						if (err) {
							reject(err);
							return;
						}

						resolve();
					});
				});
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
