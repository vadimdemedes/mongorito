'use strict';

/**
* Dependencies
*/

const toObjectId = require('../util/to-objectid');
const Promise = require('bluebird');
const assign = require('object-assign');
const is = require('is_js');


/**
* Query
*/

function Query (collection, model, key) {
	this.collection = collection;
	this.model = model;
	this.query = {};
	this.options = {
		populate: {},
		sort: {},
		fields: {}
	};
	this.lastKey = key;
}


/**
 * Set "where" condition
 *
 * @param {String} key - key
 * @param {Mixed} value - value
 * @api public
 */

Query.prototype.where = function (key, value) {
	// if object was passed instead of key-value pair
	// iterate over that object and call .where(key, value)
	if (is.object(key)) {
		let conditions = key;
		let keys = Object.keys(conditions);
		let self = this;

		keys.forEach(function (key) {
			self.where(key, conditions[key]);
		});
	}

	if (is.string(key)) {
		// if only one argument was supplied
		// save the key in this.lastKey
		// for future methods, like .equals()
		if (is.undefined(value)) {
			this.lastKey = key;
			return this;
		}

		// if value is a regular expression
		// use $regex modifier
		if (is.regexp(value)) {
			value = { $regex: value };
		}

		if (is.array(value)) {
			value = { $in: value };
		}

		this.query[key] = value;
	}

	return this;
};


/**
 * Match documents using $elemMatch
 *
 * @param {String} key
 * @param {Object} value
 * @api public
 */

Query.prototype.matches = function (key, value) {
	if (this.lastKey) {
		value = key;
		key = this.lastKey;
		this.lastKey = null;
	}

	this.query[key] = { $elemMatch: value };

	return this;
};

Query.prototype.match = function () {
	return this.matches.apply(this, arguments);
};


/**
 * Include fields in a result
 *
 * @param {String} key
 * @param {Mixed} value
 * @api public
 */

Query.prototype.include = function (key, value) {
	let self = this;

	if (Array.isArray(key)) {
		let fields = key;

		fields.forEach(function (key) {
			self.include(key);
		});
	} else if (is.object(key)) {
		let fields = key;
		let keys = Object.keys(fields);

		keys.forEach(function (key) {
			self.include(key, fields[key]);
		});
	}

	if (is.string(key)) {
		this.options.fields[key] = value === undefined ? 1 : value;
	}

	return this;
};


/**
 * Exclude fields from result
 *
 * @param {String} key
 * @param {String} value
 * @api public
 */

Query.prototype.exclude = function (key, value) {
	let self = this;

	if (Array.isArray(key)) {
		let fields = key;

		fields.forEach(function (key) {
			self.exclude(key);
		});
	} else if (is.object(key)) {
		let fields = key;
		let keys = Object.keys(fields);

		keys.forEach(function (key) {
			self.exclude(key, fields[key]);
		});
	}

	if (is.string(key)) {
		this.options.fields[key] = value === undefined ? 0 : value;
	}

	return this;
};


/**
 * Search using text index
 *
 * @param {String} text
 * @api public
 */

Query.prototype.search = function (text) {
	this.where({
		'$text': {
			'$search': text
		}
	});

	return this;
};

/**
 * Get distinct
 *
 * @param {String} field for distinct
 * @param {Object} query - query to filter the results
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#distinct
 * @api public
 */

Query.prototype.distinct = function (field, query) {
	let self = this;
	this.where(query);
	return this.collection.then(function (collection) {
		return collection.distinct(field, self.query);
	});
};

/**
 * Aggregation query
 *
 * @param {String} pipeline aggregation pipeline
 * @param {Object} options - Options to be passed to aggregation pipeline
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#aggregate
 * @api public
 */

Query.prototype.aggregate = function (pipeline) {
	return this.collection.then(function (collection) {
		let cursor = collection.aggregate(pipeline, { cursor: { batchSize: 1 } });
		return cursor
			.toArray()
			.then(function (docs) {
				cursor.close();
				return docs;
			});
	});
};




/**
 * Set query limit
 *
 * @param {Number} limit - limit number
 * @api public
 */

Query.prototype.limit = function (limit) {
	this.options.limit = limit;

	return this;
};


/**
 * Set query skip
 *
 * @param {Number} skip - skip number
 * @api public
 */

Query.prototype.skip = function (skip) {
	this.options.skip = skip;

	return this;
};


/**
 * Sort query results
 *
 * @param {Object} sort - sort params
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/Cursor.html#sort
 * @api public
 */

Query.prototype.sort = function (key, value) {
	if (is.object(key)) {
		assign(this.options.sort, key);
	}

	if (is.string(key) && value) {
		this.options.sort[key] = value;
	}

	return this;
};


/**
 * Same as .where(), only less flexible
 *
 * @param {String} key - key
 * @param {Mixed} value - value
 * @api public
 */

Query.prototype.equals = function (value) {
	let key = this.lastKey;

	this.lastKey = null;

	this.query[key] = value;

	return this;
};


/**
 * Set property that must or mustn't exist in resulting docs
 *
 * @param {String} key - key
 * @param {Boolean} exists - exists or not
 * @api public
 */

Query.prototype.exists = function (key, exists) {
	if (this.lastKey) {
		exists = key;
		key = this.lastKey;
		this.lastKey = null;
	}

	this.query[key] = { $exists: (exists === undefined ? true : exists) };

	return this;
};


/**
 * Query population
 *
 * @param {String} key - key
 * @param {Model} model - model to populate with
 * @see http://mongorito.com/guides/query-population/
 * @api public
 */

Query.prototype.populate = function (key, model) {
	this.options.populate[key] = model;

	return this;
};


/**
 * Count documents
 *
 * @param {Object} query - find conditions, same as this.where()
 * @api public
 */

Query.prototype.count = function (query) {
	let self = this;

	this.where(query);

	return this.collection.then(function (collection) {
		return collection.count(self.query);
	});
};


/**
 * Find documents
 *
 * @param {Object} query - find conditions, same as this.where()
 * @api public
 */

Query.prototype.find = function (query, options) {
	let Model = this.model;

	query = assign({}, this.query, query);

	// query options
	options = assign({}, this.options, options);

	// fields to populate
	let populate = Object.keys(options.populate);

	// ensure _id is ObjectId
	if (query._id) {
		if (is.object(query._id)) {
			if (query._id.$in) {
				let convertedIds = [];

				query._id.$in.forEach(function (id) {
					convertedIds.push(toObjectId(id));
				});

				query._id.$in = convertedIds;
			}
		} else {
			query._id = toObjectId(query._id);
		}
	}

	// find
	return this.collection
		.then(function (collection) {
			let cursor = collection.find(query, options);

			return cursor
				.toArray()
				.then(function (docs) {
					cursor.close();

					return docs;
				});
		})
		.map(function (doc) {
			return Promise.each(populate, function (key) {
				let childModel = options.populate[key];
				let idsArray = doc[key];

				let promise = childModel.findById(idsArray);

				return promise.then(function (subdocs) {
					// reorder the received documents as ordered in the IDs Array
					let orderedDocuments = idsArray.slice();
					subdocs.map(doc => {
						let id = toObjectId(doc.get('_id'));
						for (let index in idsArray) {
							if (idsArray[index].equals && idsArray[index].equals(id)) {
								orderedDocuments[index] = doc;
							}
						}
					});

					doc[key] = orderedDocuments;
				});
			}).then(function () {
				return new Model(doc, {
					populate: options.populate
				});
			});
		});
};


/**
 * Find one document
 *
 * @param {Object} query - find conditions, same as this.where()
 * @api public
 */

Query.prototype.findOne = function (query) {
	return this.find(query)
		.then(function (docs) {
			return docs[0];
		});
};


/**
 * Find documents by ID
 *
 * @param {ObjectID} id - document id or Array of document ids
 * @api public
 */

Query.prototype.findById = function (id) {
	if (Array.isArray(id)) {
		let ids = id.map(id => toObjectId(id));
		return this.find({ _id: { $in: ids } });
	}
	return this.findOne({ _id: toObjectId(id) });
};


/**
 * Remove documents
 *
 * @param {Object} query - remove conditions, same as this.where()
 * @api public
 */

Query.prototype.remove = function (query) {
	let self = this;

	this.where(query);

	return this.collection.then(function (collection) {
		return collection.remove(self.query, self.options);
	});
};

// Setting up functions that
// have the same implementation
const methods = [
	'lt',
	'lte',
	'gt',
	'gte',
	'in',
	'nin',
	'ne'
];

methods.forEach(function (method) {
	Query.prototype[method] = function (key, value) {
		// if .where() was called with one argument
		// key was already set in this.lastKey
		if (this.lastKey) {
			value = key;
			key = this.lastKey;
			this.lastKey = null;
		}

		let operator = '$' + method;
		let hasValue = value !== undefined;

		if (hasValue) {
			this.query[key] = {};
			this.query[key][operator] = value;
		} else {
			this.query[operator] = key;
		}

		return this;
	};
});

// or, nor and and share the same imlpementation
['or', 'nor', 'and'].forEach(function (method) {
	Query.prototype[method] = function () {
		let args = Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments);
		let operator = '$' + method;

		this.query[operator] = args;

		return this;
	};
});


/**
 * Expose Query
 */

module.exports = Query;
