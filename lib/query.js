/**
 * Module dependencies
 */

var Class = require('class-extend');

var util = require('./util');

var isObjectID = util.isObjectID;
var isRegExp = util.isRegExp;
var isObject = util.isObject;
var isString = util.isString;


/**
 * Query
 */

var Query = module.exports = Class.extend({
	constructor: function (collection, model, key) {
		this.collection = collection;
		this.model = model;
		this.query = {};
		this.options = { populate: {} };
		this.lastKey = key;
	},
	
	where: function (key, value) {
		// if object was passed instead of key-value pair
		// iterate over that object and call .where(key, value)
		if (isObject(key)) {
			var conditions = key;
			
			Object.keys(conditions).forEach(function (key) {
			  this.where(key, conditions[key]);
			}, this);
		
		}
		
		if (isString(key)) {
			// if only one argument was supplied
			// save the key in this.lastKey
			// for future methods, like .equals()
			if (undefined == value) {
				this.lastKey = key;
				return this;
			}
			
			// 1. if regular expression
			// 2. if object and not ObjectID
			if (isRegExp(value)) {
				value = { $regex: value };
		  } else if (isObject(value) && false === isObjectID(value)) {
				value = { $elemMatch: value };
			}
			
			this.query[key] = value;
		}
		
		return this;
	},
	
	limit: function (limit) {
		this.options.limit = limit;
		
		return this;
	},
	
	skip: function (skip) {
		this.options.skip = skip;
		
		return this;
	},
	
	sort: function (sort) {
		this.options.sort = sort;
		
		return this;
	},
	
	equals: function (value) {
		var key = this.lastKey;
		delete this.lastKey;
		
		this.query[key] = value;
		
		return this;
	},
	
	exists: function (key, exists) {
		if (this.lastKey) {
			exists = key;
			key = this.lastKey;
			delete this.lastKey;
		}
		
		this.query[key] = { $exists: exists || true };
		
		return this;
	},
	
	populate: function (key, model) {
		this.options.populate[key] = model;
		
		return this;
	},
	
	count: function *(query) {
		this.where(query);
		
		var collection = this.collection;
		var model = this.model;
		
		var count = collection.count(this.query);
		
		return yield count;
	},
	
	find: function *(query) {
		this.where(query);
		
		var collection = this.collection;
		var model = this.model;
		var options = this.options;
		
		// fields to populate
		var populate = Object.keys(options.populate);
		
		var docs = yield collection.find(this.query, options);
		
		var index = 0;
		var doc;
		
		while (doc = docs[index++]) {
			// options.populate is a key-model pair object
			var j = 0;
			var key;
			
			while (key = populate[j++]) {
				// model to use when populating the field
				var model = options.populate[key];
				
				var value = doc[key];
				
				// if value is an array of IDs, loop through it
				if (value instanceof Array) {
				  // convert each _id to String
				  // and then convert it to
				  // findById function
				  var subdocs = value.map(String).map(model.findById, model);
					
					// find sub documents
					value = yield subdocs;
				} else {
					value = yield model.findById(value);
				}
				
				// replace previous ID with actual documents
				doc[key] = value;
			}
			
			// index - 1, because index here is already an index of the next document
			docs[index - 1] = new model(doc, {
				populate: options.populate
			});
		}
		
		return docs;
	},
	
	findOne: function *(query) {
		var docs = yield this.find(query);
		
		return docs[0];
	},
	
	remove: function *(query) {
		this.where(query);
		
		var collection = this.collection;
		var model = this.model;
		
		return yield collection.remove(this.query, this.options);
	}
});

// Setting up functions that
// have the same implementation
var methods = [
	'lt',
	'lte',
	'gt',
	'gte',
	'in',
	'nin',
	'and',
	'or',
	'ne',
	'nor'
];

methods.forEach(function (method) {
	Query.prototype[method] = function (key, value) {
		// if .where() was called with one argument
		// key was already set in this.lastKey
		if (this.lastKey) {
			value = key;
			key = this.lastKey;
			delete this.lastKey;
		}
		
		this.query[key] = {};
		this.query[key]['$' + method] = value;
		
		return this;
	}
});