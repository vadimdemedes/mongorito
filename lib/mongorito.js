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

var Mongorito = {
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
		return wrap(this.db.get(collection));
	}
};

/**
 * Model
 */

Function.prototype.before = function (action) {
	this.hook = {
		when: 'before',
		action: action
	};
	
	return this;
};

Function.prototype.after = function (action) {
	this.hook = {
		when: 'after',
		action: action
	};
	
	return this;
};

Function.prototype.around = function (action) {
	this.hook = {
		when: 'around',
		action: action
	};
	
	return this;
};

var Model;

var InstanceMethods = {
	initialize: function (attrs) {
		this.attributes = attrs || {};
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
		
		yield this.runHooks('before', 'save');
		
		var result = yield fn.call(this);
		
		yield this.runHooks('after', 'save');
		
		return result;
	},
	
	create: function *() {
		yield this.runHooks('before', 'create');
		
		var collection = this.collection;
		var attrs = this.attributes;
		
		var timestamp = Math.round(new Date().getTime() / 1000);
		this.set({
			created_at: timestamp,
			updated_at: timestamp
		});
		
		var doc = yield collection.insert(attrs);
		
		this.set('_id', doc._id);
		
		yield this.runHooks('after', 'create');
		
		return this;
	},
	
	update: function *() {
		yield this.runHooks('before', 'update');
		
		var collection = this.collection;
		var attrs = this.attributes;
		
		var timestamp = Math.round(new Date().getTime() / 1000);
		this.set('updated_at', timestamp);
		
		yield collection.updateById(attrs._id, attrs);
		
		yield this.runHooks('after', 'update');
		
		return this;
	},
	
	remove: function *() {
		yield this.runHooks('before', 'remove');
		
		var collection = this.collection;
		
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
	
	remove: function *() {
		var collection = this.collection();
		
		yield collection.remove({});
	},
	
	id: function () {
		var collection = this.collection();
		
		return collection.id.apply(collection, arguments);
	}
};

['where', 'limit', 'skip', 'sort', 'exists', 'lt', 'lte', 'gt', 'gte', 'in', 'nin', 'and', 'or', 'ne', 'nor'].forEach(function (method) {
	StaticMethods[method] = function () {
		var collection = this.collection();
		var model = this;
		
		var query = new Query(collection, model);
		query[method].apply(query, arguments);
		
		return query;
	};
});

Model = Mongorito.Model = Class.extend(InstanceMethods, StaticMethods);


/**
 * Query
 *
*/

var Query = Class.extend({
	initialize: function (collection, model, key) {
		this.collection = collection;
		this.model = model;
		this.query = {};
		this.options = {};
		this.lastKey = key;
	},
	
	where: function (key, value) {
		if (typeof arguments[0] == 'object') {
			var conditions = key;
			for (key in conditions) {
				this.where(key, conditions[key]);
			}
		} else {
			if (!value) {
				this.lastKey = key;
				return this;
			}
			
			if (value instanceof RegExp) {
				value = { $regex: value };
			} else if (typeof value == 'object') {
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
		
		var docs = yield collection.find(this.query, this.options);
		
		return docs.map(function (doc) {
			return new model(doc);
		});
	}
});

['lt', 'lte', 'gt', 'gte', 'in', 'nin', 'and', 'or', 'ne', 'nor'].forEach(function (method) {
	Query.prototype[method] = function (key, value) {
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


/**
 * Module exports
 */

module.exports = Mongorito;