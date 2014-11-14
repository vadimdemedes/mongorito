/**
 * Module dependencies
 */

var Class = require('backbone-class');
var compose = require('koa-compose');
var monk = require('monk');
var wrap = require('co-monk');


/**
 * Mongorito
 * 
 * Main class, manages mongodb connection and collections
 */

var Mongorito = module.exports = {
	connect: function () {
		this.db = monk.apply(null, arguments);
	},
	
	disconnect: function () {
		this.db.close();
	},
	
	close: function () {
		return this.disconnect.apply(this, arguments);
	},
	
	collection: function (collection) {
		collection = this.db.get(collection);
		collection = wrap(collection);
		
		return collection;
	}
};


/**
 * Module exports
 */

var exports = module.exports;


/**
 * Query
 */

var Query = require('./query');


/**
 * Model
 */

var Model;

var InstanceMethods = {
	initialize: function (attrs, options) {
		this.attributes = attrs || {};
		this.options = options || {};
		this.collection = Mongorito.collection(this.collection);
		this.configure();
	},
	
	get: function (key) {
		var attrs = this.attributes;
		
		return key ? attrs[key] : attrs;
	},
	
	set: function (key, value) {
		// if object passed instead of key-value pair
		// iterate and call set on each item
		if (arguments.length == 1 && typeof key == 'object') {
			var attrs = key;
			
			for (key in attrs) {
				this.set(key, attrs[key]);
			}
			
			return;
		}
		
		return this.attributes[key] = value;
	},
	
	toJSON: function () {
		return this.attributes;
	},
	
	configure: function () {
		this.hooks = {
			before: {
				create: [],
				update: [],
				remove: [],
				save: []
			},
			after: {
				create: [],
				update: [],
				remove: [],
				save: []
			}
		};
		
		for (var name in this) {
			var fn = this[name];
			
			if (fn.hook) {
				var action = fn.hook.action;
				var when = fn.hook.when;
				
				delete fn.hook;
				
				switch (when) {
					case 'before':
					case 'after':
						this.hooks[when][action].push(fn);
						break;
					
					case 'around':
						this.hooks['before'][action].push(fn);
						this.hooks['after'][action].unshift(fn);
						break;
				}
			}
		}
	},
	
	runHooks: function *(when, action) {
		yield compose(this.hooks[when][action]).call(this);
	},
	
	save: function *() {
		var id = this.get('_id');
		var fn = id ? this.update : this.create;
		
		// revert populated documents to _id's
		var populate = this.options.populate;
		for (var key in populate) {
			var value = this.get(key);
			
			if (value instanceof Array) {
				value = value.map(function (doc) {
					return doc.get('_id');
				});
			} else {
				value = value.get('_id');
			}
			
			this.set(key, value);
		}
		
		yield this.runHooks('before', 'save');
		var result = yield fn.call(this);
		yield this.runHooks('after', 'save');
		
		return result;
	},
	
	create: function *() {
		var collection = this.collection;
		var attrs = this.attributes;
		
		var timestamp = Math.round(new Date().getTime() / 1000);
		this.set({
			created_at: timestamp,
			updated_at: timestamp
		});
		
		yield this.runHooks('before', 'create');
		
		var doc = yield collection.insert(attrs);
		this.set('_id', doc._id);
		
		yield this.runHooks('after', 'create');
		
		return this;
	},
	
	update: function *() {
		var collection = this.collection;
		var attrs = this.attributes;
		
		var timestamp = Math.round(new Date().getTime() / 1000);
		this.set('updated_at', timestamp);
		
		yield this.runHooks('before', 'update');
		yield collection.updateById(attrs._id, attrs);
		yield this.runHooks('after', 'update');
		
		return this;
	},
	
	remove: function *() {
		var collection = this.collection;
		
		yield this.runHooks('before', 'remove');
		yield collection.remove({
			_id: this.get('_id')
		});
		yield this.runHooks('after', 'remove');
		
		return this;
	}
};

var StaticMethods = {
	collection: function () {
		var name = this.prototype.collection;
		
		return Mongorito.collection(name);
	},
	
	find: function *(query) {
		var collection = this.collection();
		var model = this;
		
		var query = new Query(collection, model).find(query);
		
		return yield query;
	},
	
	count: function *(query) {
		var collection = this.collection();
		var model = this;
		
		var count = new Query(collection, model).count(query);
		
		return yield count;
	},
	
	all: function *() {
		var docs = yield this.find();
		
		return docs;
	},
	
	findOne: function *(query) {
		var docs = yield this.find(query);
		
		return docs[0];
	},
	
	findById: function *(id) {
		var doc = yield this.findOne({ _id: id });
		
		return doc;
	},
	
	remove: function *(query) {
		var collection = this.collection();
		var model = this;
		
		var query = new Query(collection, model).remove(query);
		
		return yield query;
	},
	
	index: function *(fields) {
		var collection = this.collection();
		
		return yield collection.index(fields);
	},
	
	indexes: function *() {
		var collection = this.collection();
		
		return yield collection.indexes();
	},
	
	id: function () {
		var collection = this.collection();
		
		return collection.id.apply(collection, arguments);
	}
};

// Setting up functions that have
// the same implementation
// and act as a bridge to Query
var methods = [
	'where',
	'limit',
	'skip',
	'sort',
	'exists', 
	'lt',
	'lte',
	'gt',
	'gte', 
	'in',
	'nin',
	'and',
	'or',
	'ne',
	'nor',
	'populate'
];

methods.forEach(function (method) {
	StaticMethods[method] = function () {
		var collection = this.collection();
		var model = this;
		
		var query = new Query(collection, model);
		query[method].apply(query, arguments);
		
		return query;
	};
});

exports.Model = Model = Class.extend(InstanceMethods, StaticMethods);


/**
 * Extending Function prototype
 */

require('./util');