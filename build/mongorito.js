"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/**
* Dependencies
*/

var ObjectID = require("monk/node_modules/mongoskin").ObjectID;
var Class = require("class-extend");

var pluralize = require("pluralize");
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

var Mongorito = (function () {
  function Mongorito() {
    _classCallCheck(this, Mongorito);
  }

  Mongorito.connect = function connect() {
    for (var _len = arguments.length, urls = Array(_len), _key = 0; _key < _len; _key++) {
      urls[_key] = arguments[_key];
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

  Mongorito.disconnect = function disconnect() {
    this.db.close();
  };

  Mongorito.close = function close() {
    return this.disconnect.apply(this, arguments);
  };

  Mongorito.collection = function collection(db, name) {
    var url = db.driver._connect_args[0];
    var collections = this.collections[url];

    if (!collections) {
      collections = this.collections[url] = {};
    }

    if (collections[name]) {
      return collections[name];
    }var collection = db.get(name);
    return collections[name] = wrap(collection);
  };

  return Mongorito;
})();

Mongorito.collections = {};


/**
* Query
*/

var Query = require("./query");


/**
* Model
*/

var Model = (function () {
  function Model() {
    var attrs = arguments[0] === undefined ? {} : arguments[0];
    var options = arguments[1] === undefined ? {} : arguments[1];
    _classCallCheck(this, Model);

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
  }

  Model.prototype.get = function get(key) {
    var attrs = this.attributes;

    return key ? attrs[key] : attrs;
  };

  Model.prototype.set = function set(key, value) {
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

      if (typeof _ret === "object") {
        return _ret.v;
      }
    }

    this.previous[key] = this.get(key);
    this.attributes[key] = value;
    this.changed[key] = value;

    return value;
  };

  Model.prototype.setDefaults = function setDefaults() {
    var _this = this;
    var defaults = this.defaults || {};
    var keys = Object.keys(defaults);

    keys.forEach(function (key) {
      var defaultValue = defaults[key];
      var actualValue = _this.get(key);

      if (undefined == actualValue) {
        _this.set(key, defaultValue);
      }
    });
  };

  Model.prototype.toJSON = function toJSON() {
    return this.attributes;
  };

  Model.prototype.configure = function configure() {};

  Model.prototype.hook = function hook(when, action, method) {
    var _this = this;
    if (isObject(when)) {
      var _ret = (function () {
        var hooks = when;
        var keys = Object.keys(hooks);

        keys.forEach(function (key) {
          var _key$split = key.split(":");

          var _key$split2 = _slicedToArray(_key$split, 2);

          var when = _key$split2[0];
          var action = _key$split2[1];
          var method = hooks[key];

          _this.hook(when, action, method);
        });

        return {
          v: undefined
        };
      })();

      if (typeof _ret === "object") {
        return _ret.v;
      }
    }

    if (isArray(method)) {
      var _methods = method;

      _methods.forEach(function (method) {
        return _this.hook(when, action, method);
      });

      return;
    }

    if (false === isFunction(method)) method = this[method];

    if ("around" === when) {
      this._hooks.before[action].push(method);
      this._hooks.after[action].unshift(method);
    } else {
      this._hooks[when][action].push(method);
    }
  };

  Model.prototype.hooks = function hooks() {
    return this.hook.apply(this, arguments);
  };

  Model.prototype.before = function before(action, method) {
    this.hook("before", action, method);
  };

  Model.prototype.after = function after(action, method) {
    this.hook("after", action, method);
  };

  Model.prototype.around = function around(action, method) {
    this.hook("around", action, method);
  };

  Model.prototype.runHooks = function* runHooks(when, action) {
    var hooks = this._hooks[when][action];

    yield compose(hooks).call(this);
  };

  Model.prototype.save = function* save() {
    var _this = this;
    // set default values if needed
    this.setDefaults();

    var id = this.get("_id");
    var fn = id ? this.update : this.create;

    // revert populated documents to _id's
    var populate = this.options.populate || emptyObject;
    var keys = Object.keys(populate);

    keys.forEach(function (key) {
      var value = _this.get(key);

      if (isArray(value)) {
        value = value.map(function (doc) {
          return doc.get("_id");
        });
      } else {
        value = value.get("_id");
      }

      _this.set(key, value);
    });

    yield this.runHooks("before", "save");
    var result = yield fn.call(this);
    yield this.runHooks("after", "save");

    return result;
  };

  Model.prototype.create = function* create() {
    var collection = this._collection;
    var attrs = this.attributes;

    var date = new Date();
    this.set({
      created_at: date,
      updated_at: date
    });

    yield this.runHooks("before", "create");

    var doc = yield collection.insert(attrs);
    this.set("_id", doc._id);

    yield this.runHooks("after", "create");

    return this;
  };

  Model.prototype.update = function* update() {
    var collection = this._collection;
    var attrs = this.attributes;

    this.set("updated_at", new Date());

    yield this.runHooks("before", "update");
    yield collection.updateById(attrs._id, attrs);
    yield this.runHooks("after", "update");

    return this;
  };

  Model.prototype.remove = function* remove() {
    var collection = this._collection;

    yield this.runHooks("before", "remove");
    yield collection.remove({ _id: this.get("_id") });
    yield this.runHooks("after", "remove");

    return this;
  };

  Model._collection = function _collection() {
    if (!this.prototype.collection) {
      this.prototype.collection = pluralize(this.name).toLowerCase();
    }

    var name = this.prototype.collection;

    // support for multiple connections
    // if model has a custom database assigned
    // use it, otherwise use the default
    var db = this.prototype.db || Mongorito.db;

    return Mongorito.collection(db, name);
  };

  Model.find = function* find(query) {
    var collection = this._collection();
    var model = this;

    var q = new Query(collection, model).find(query);

    return yield q;
  };

  Model.count = function* count(query) {
    var collection = this._collection();
    var model = this;

    var count = new Query(collection, model).count(query);

    return yield count;
  };

  Model.all = function* all() {
    return yield this.find();
  };

  Model.findOne = function* findOne(query) {
    var docs = yield this.find(query);

    return docs[0];
  };

  Model.findById = function* findById(id) {
    return yield this.findOne({ _id: id });
  };

  Model.remove = function* remove(query) {
    var collection = this._collection();
    var model = this;

    var query = new Query(collection, model).remove(query);

    return yield query;
  };

  Model.index = function* index() {
    var collection = this._collection();

    return yield collection.index.apply(collection, arguments);
  };

  Model.indexes = function* indexes() {
    var collection = this._collection();

    return yield collection.indexes();
  };

  Model.id = function id() {
    var collection = this._collection();

    return collection.id.apply(collection, arguments);
  };

  _prototypeProperties(Model, null, {
    _collection: {
      get: function () {
        if (!this.collection) {
          var _constructor = this.constructor;

          this.collection = _constructor.prototype.collection = pluralize(_constructor.name).toLowerCase();
        }

        return Mongorito.collection(this._db, this.collection);
      },
      configurable: true
    },
    _db: {
      get: function () {
        return this.db || Mongorito.db;
      },
      configurable: true
    }
  });

  return Model;
})();

// Setting up functions that have
// the same implementation
// and act as a bridge to Query
var methods = ["where", "limit", "skip", "sort", "exists", "lt", "lte", "gt", "gte", "in", "nin", "and", "or", "ne", "nor", "populate"];

methods.forEach(function (method) {
  Model[method] = function () {
    var collection = this._collection();
    var model = this;

    var query = new Query(collection, model);
    query[method].apply(query, arguments);

    return query;
  };
});

Model.extend = Class.extend;


/**
* Expose Mongorito
*/

var exports = module.exports = Mongorito;

exports.ObjectID = ObjectID;
exports.Model = Model;

var emptyObject = {};
