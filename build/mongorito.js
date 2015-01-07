"use strict";

var _slicedToArray = function (arr, i) {
  if (Array.isArray(arr)) {
    return arr;
  } else {
    var _arr = [];

    for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
      _arr.push(_step.value);

      if (i && _arr.length === i) break;
    }

    return _arr;
  }
};

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

/**
* Dependencies
*/

var Class = require("class-extend");
var compose = require("koa-compose");
var monk = require("monk");
var wrap = require("co-monk");
var util = require("./util");

var isFunction = util.isFunction;
var isObject = util.isObject;
var isArray = util.isArray;


/**
* Mongorito
* 
* Main class, manages mongodb connection and collections
*/

var Mongorito = function Mongorito() {};

Mongorito.connect = function () {
  var urls = [];

  for (var _key = 0; _key < arguments.length; _key++) {
    urls[_key] = arguments[_key];
  }

  urls = urls.map(function (url) {
    return url.replace(/^mongo\:\/\//, "");
  });

  var db = monk.apply(null, urls);

  if (!this.db) this.db = db;

  return db;
};

var Mongorito = function Mongorito() {};

Mongorito.connect = function () {
  var urls = [];

  for (var _key2 = 0; _key2 < arguments.length; _key2++) {
    urls[_key2] = arguments[_key2];
  }

  // convert mongo:// urls to monk-supported ones
  urls = urls.map(function (url) {
    return url.replace(/^mongo\:\/\//, "");
  });

  var db = monk.apply(null, urls);

  // if there is already a connection
  // don't overwrite it with a new one
  if (!this.db) this.db = db;

  return db;
};

Mongorito.disconnect = function () {
  this.db.close();
};

Mongorito.close = function () {
  return this.disconnect.apply(this, arguments);
};

Mongorito.collection = function (db, name) {
  var url = db.driver._connect_args[0];
  var collections = this.collections[url];

  if (!collections) {
    collections = this.collections[url] = {};
  }

  if (collections[name]) return collections[name];

  var _collection2 = db.get(name);
  return collections[name] = wrap(_collection2);
};

Mongorito.collections = {};


/**
* Expose `Mongorito`
*/

var exports = module.exports = Mongorito;


/**
* Query
*/

var Query = require("./query");


/**
* Model
*/

var Model = function Model() {
  var attrs = arguments[0] === undefined ? {} : arguments[0];
  var options = arguments[1] === undefined ? {} : arguments[1];
  this.attributes = attrs;
  this.changed = {};
  this.previous = {};
  this.options = options;

  // reset hooks
  Object.defineProperty(this, "_hooks", {
    value: {
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
    },
    enumerable: false
  });

  // run custom per-model configuration
  this.configure();
};

Model.prototype.get = function (key) {
  var attrs = this.attributes;

  return key ? attrs[key] : attrs;
};

Model.prototype.set = function (key, value) {
  var _this = this;
  // if object passed instead of key-value pair
  // iterate and call set on each item
  if (isObject(key)) {
    var _ret = (function () {
      var attrs = key;
      var keys = Object.keys(attrs);

      keys.forEach(function (key) {
        return _this.set(key, attrs[key]);
      });

      return {
        v: undefined
      };
    })();

    if (typeof _ret === "object") return _ret.v;
  }

  this.previous[key] = this.get(key);
  this.attributes[key] = value;
  this.changed[key] = value;

  return value;
};

Model.prototype.setDefaults = function () {
  var _this2 = this;
  var defaults = this.defaults || {};
  var keys = Object.keys(defaults);

  keys.forEach(function (key) {
    var defaultValue = defaults[key];
    var actualValue = _this2.get(key);

    if (undefined == actualValue) {
      _this2.set(key, defaultValue);
    }
  });
};

Model.prototype.toJSON = function () {
  return this.attributes;
};

Model.prototype.configure = function () {};

Model.prototype.hook = function (when, action, method) {
  var _this3 = this;
  if (isObject(when)) {
    var _ret2 = (function () {
      var _hooks = when;
      var keys = Object.keys(_hooks);

      keys.forEach(function (key) {
        var _key$split = key.split(":");

        var _key$split2 = _slicedToArray(_key$split, 2);

        var _when = _key$split2[0];
        var _action = _key$split2[1];
        var _method = _hooks[key];

        _this3.hook(_when, _action, _method);
      });

      return {
        v: undefined
      };
    })();

    if (typeof _ret2 === "object") return _ret2.v;
  }

  if (isArray(method)) {
    var _ret3 = (function () {
      var _methods = method;

      _methods.forEach(function (method) {
        return _this3.hook(when, action, method);
      });

      return {
        v: undefined
      };
    })();

    if (typeof _ret3 === "object") return _ret3.v;
  }

  if (false === isFunction(method)) method = this[method];

  if ("around" === when) {
    this._hooks.before[action].push(method);
    this._hooks.after[action].unshift(method);
  } else {
    this._hooks[when][action].push(method);
  }
};

Model.prototype.hooks = function () {
  return this.hook.apply(this, arguments);
};

Model.prototype.before = function (action, method) {
  this.hook("before", action, method);
};

Model.prototype.after = function (action, method) {
  this.hook("after", action, method);
};

Model.prototype.around = function (action, method) {
  this.hook("around", action, method);
};

Model.prototype.runHooks = function* (when, action) {
  var _hooks2 = this._hooks[when][action];

  yield compose(_hooks2).call(this);
};

Model.prototype.save = function* () {
  var _this4 = this;
  // set default values if needed
  this.setDefaults();

  var _id = this.get("_id");
  var fn = _id ? this.update : this.create;

  // revert populated documents to _id's
  var populate = this.options.populate || emptyObject;
  var keys = Object.keys(populate);

  keys.forEach(function (key) {
    var value = _this4.get(key);

    if (isArray(value)) {
      value = value.map(function (doc) {
        return doc.get("_id");
      });
    } else {
      value = value.get("_id");
    }

    _this4.set(key, value);
  });

  yield this.runHooks("before", "save");
  var result = yield fn.call(this);
  yield this.runHooks("after", "save");

  return result;
};

Model.prototype.create = function* () {
  var _collection3 = this._collection;
  var attrs = this.attributes;

  var timestamp = new Date().getTime();
  this.set({
    created_at: timestamp,
    updated_at: timestamp
  });

  yield this.runHooks("before", "create");

  var doc = yield _collection3.insert(attrs);
  this.set("_id", doc._id);

  yield this.runHooks("after", "create");

  return this;
};

Model.prototype.update = function* () {
  var _collection4 = this._collection;
  var attrs = this.attributes;

  var timestamp = new Date().getTime();
  this.set("updated_at", timestamp);

  yield this.runHooks("before", "update");
  yield _collection4.updateById(attrs._id, attrs);
  yield this.runHooks("after", "update");

  return this;
};

Model.prototype.remove = function* () {
  var _collection5 = this._collection;

  yield this.runHooks("before", "remove");
  yield _collection5.remove({ _id: this.get("_id") });
  yield this.runHooks("after", "remove");

  return this;
};

Model.collection = function () {
  var name = this.prototype.collection;

  // support for multiple connections
  // if model has a custom database assigned
  // use it, otherwise use the default
  var db = this.prototype.db || Mongorito.db;

  return Mongorito.collection(db, name);
};

Model.find = function* (query) {
  var _collection6 = this.collection();
  var model = this;

  var q = new Query(_collection6, model).find(query);

  return yield q;
};

Model.count = function* (query) {
  var _collection7 = this.collection();
  var model = this;

  var _count = new Query(_collection7, model).count(query);

  return yield _count;
};

Model.all = function* () {
  return yield this.find();
};

Model.findOne = function* (query) {
  var docs = yield this.find(query);

  return docs[0];
};

Model.findById = function* (id) {
  return yield this.findOne({ _id: id });
};

Model.remove = function* (query) {
  var _collection8 = this.collection();
  var model = this;

  var _query = new Query(_collection8, model).remove(_query);

  return yield _query;
};

Model.index = function* (fields) {
  var _collection9 = this.collection();

  return yield _collection9.index(fields);
};

Model.indexes = function* () {
  var _collection10 = this.collection();

  return yield _collection10.indexes();
};

Model.id = function () {
  var _collection11 = this.collection();

  return _collection11.id.apply(_collection11, arguments);
};

_prototypeProperties(Model, null, {
  _collection: {
    get: function () {
      return Mongorito.collection(this._db, this.collection);
    },
    enumerable: true
  },
  _db: {
    get: function () {
      return this.db || Mongorito.db;
    },
    enumerable: true
  }
});

// Setting up functions that have
// the same implementation
// and act as a bridge to Query
var methods = ["where", "limit", "skip", "sort", "exists", "lt", "lte", "gt", "gte", "in", "nin", "and", "or", "ne", "nor", "populate"];

methods.forEach(function (method) {
  Model[method] = function () {
    var _collection12 = this.collection();
    var model = this;

    var query = new Query(_collection12, model);
    query[method].apply(query, arguments);

    return query;
  };
});

Model.extend = Class.extend;

exports.Model = Model;

var emptyObject = {};
