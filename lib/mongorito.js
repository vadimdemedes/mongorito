"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/**
* Dependencies
*/

const ObjectID = require("monk/node_modules/mongoskin").ObjectID;
const Class = require("class-extend");

const mongoskin = require("monk/node_modules/mongoskin");
const pluralize = require("pluralize");
const compose = require("koa-compose");
const result = require("lodash.result");
const monk = require("monk");
const wrap = require("co-monk");
const is = require("is_js");

const Query = require("./query");
const util = require("./util");


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

    var db = monk.apply(undefined, urls);

    // if there is already a connection
    // don't overwrite it with a new one
    if (!this.db) this.db = db;

    return db;
  };

  Mongorito.disconnect = function disconnect() {
    this.db.close();
  };

  Mongorito.close = function close() {
    var _ref;
    return (_ref = this).disconnect.apply(_ref, arguments);
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
    collections[name] = wrap(collection);

    return collections[name];
  };

  return Mongorito;
})();

Mongorito.collections = {};


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

    // if key is not set
    // return all attributes
    return key ? attrs[key] : attrs;
  };

  Model.prototype.set = function set(key, value) {
    var _this = this;
    // if object passed instead of key-value pair
    // iterate and call set on each item
    if (is.object(key)) {
      var _ret = (function () {
        var attrs = key;
        var keys = Object.keys(attrs);

        keys.forEach(function (key) {
          _this.set(key, attrs[key]);
        });

        return {
          v: undefined
        };
      })();

      if (typeof _ret === "object") {
        return _ret.v;
      }
    }

    // check if the value actually changed
    if (this.get(key) !== value) {
      this.previous[key] = this.get(key);
      this.attributes[key] = value;
      this.changed[key] = true;
    }

    return value;
  };

  Model.prototype.setDefaults = function setDefaults() {
    var _this = this;
    var defaults = result(this, "defaults", {});
    var keys = Object.keys(defaults);

    keys.forEach(function (key) {
      var defaultValue = defaults[key];
      var actualValue = _this.get(key);

      if (is.undefined(actualValue)) {
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
    if (is.object(when)) {
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

    if (is.array(method)) {
      var _methods = method;

      _methods.forEach(function (method) {
        return _this.hook(when, action, method);
      });

      return;
    }

    if (is.not["function"](method)) method = this[method];

    if (when === "around") {
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
    var options = arguments[2] === undefined ? {} : arguments[2];
    var hooks = this._hooks[when][action];

    // skip middleware
    var skip = options.skip;

    if (skip) {
      if (is.string(skip)) skip = [skip];

      hooks = hooks.filter(function (fn) {
        return skip.indexOf(fn.name) === -1;
      });
    }

    yield compose(hooks);
  };

  Model.prototype.save = function* save(options) {
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

      if (is.array(value)) {
        value = value.map(function (doc) {
          return doc.get("_id");
        });
      } else {
        value = value.get("_id");
      }

      _this.set(key, value);
    });

    yield* this.runHooks("before", "save", options);
    var result = yield fn.call(this, options);
    yield* this.runHooks("after", "save", options);

    return result;
  };

  Model.prototype.create = function* create(options) {
    var collection = this._collection;
    var attrs = this.attributes;

    var date = new Date();
    this.set({
      created_at: date,
      updated_at: date
    });

    yield* this.runHooks("before", "create", options);

    var doc = yield collection.insert(attrs);
    this.set("_id", doc._id);

    yield* this.runHooks("after", "create", options);

    return this;
  };

  Model.prototype.update = function* update(options) {
    var collection = this._collection;
    var attrs = this.attributes;

    this.set("updated_at", new Date());

    yield* this.runHooks("before", "update", options);
    yield collection.updateById(attrs._id, attrs);
    yield* this.runHooks("after", "update", options);

    return this;
  };

  Model.prototype.remove = function* remove(options) {
    var collection = this._collection;

    yield* this.runHooks("before", "remove", options);
    yield collection.remove({ _id: this.get("_id") });
    yield* this.runHooks("after", "remove", options);

    return this;
  };

  Model.prototype.inc = function* inc(props, options) {
    var _this = this;
    var id = this.get("_id");

    if (!id) {
      throw new Error("Can't atomically increment a property of unsaved document.");
    }

    var collection = this._collection;

    yield* this.runHooks("before", "save", options);
    yield* this.runHooks("before", "update", options);

    yield collection.updateById(id, {
      $inc: props
    });

    Object.keys(props).forEach(function (key) {
      // get current value
      var value = _this.get(key);

      // perform increment
      value += props[key];

      // save
      _this.set(key, value);
    });

    yield* this.runHooks("after", "update", options);
    yield* this.runHooks("after", "save", options);

    return this;
  };

  Model.find = function find(conditions) {
    var query = new Query(this._collection, this).find(conditions); // collection, model

    return query;
  };

  Model.count = function count(query) {
    var count = new Query(this._collection, this).count(query); // collection, model

    return count;
  };

  Model.all = function all() {
    return this.find();
  };

  Model.findOne = function* findOne(query) {
    var docs = yield* this.find(query);

    return docs[0];
  };

  Model.findById = function findById(id) {
    return this.findOne({ _id: id });
  };

  Model.remove = function remove(query) {
    var query = new Query(this._collection, this).remove(query); // collection, model

    return query;
  };

  Model.index = function* index() {
    var _collection;
    return yield (_collection = this._collection).index.apply(_collection, arguments);
  };

  Model.indexes = function* indexes() {
    return yield this._collection.indexes();
  };

  Model.id = function id() {
    var _collection;
    return (_collection = this._collection).id.apply(_collection, arguments);
  };

  _prototypeProperties(Model, {
    _db: {
      get: function () {
        // support for multiple connections
        // if model has a custom database assigned
        // use it, otherwise use the default
        return this.prototype.db || Mongorito.db;
      },
      configurable: true
    },
    _collection: {
      get: function () {
        if (is.string(this.prototype.collection)) {
          return Mongorito.collection(this._db, this.prototype.collection);
        }

        // get collection name
        // from the "collection" property
        // or generate the default one
        var defaultName = pluralize(this.name).toLowerCase();
        var name = result(this.prototype, "collection", defaultName);

        // save collection name
        // to avoid the same check in future
        this.prototype.collection = name;

        return Mongorito.collection(this._db, name);
      },
      configurable: true
    }
  }, {
    _collection: {
      get: function () {
        if (is.string(this.collection)) {
          return Mongorito.collection(this._db, this.collection);
        }

        // get collectio name
        // from the "collection" property
        // or generate the default one
        var defaultName = pluralize(this.constructor.name).toLowerCase();
        var name = result(this, "collection", defaultName);

        // save collection name
        // to avoid the same check in future
        this.collection = this.constructor.prototype.collection = name;

        return Mongorito.collection(this._db, this.collection);
      },
      configurable: true
    },
    _db: {
      get: function () {
        // use either custom database
        // specified for this model
        // or use a default one
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
const methods = ["where", "limit", "skip", "sort", "exists", "lt", "lte", "gt", "gte", "in", "nin", "and", "or", "ne", "nor", "populate"];

methods.forEach(function (method) {
  Model[method] = function () {
    var query = new Query(this._collection, this); // collection, model
    query[method].apply(query, arguments);

    return query;
  };
});

Model.extend = Class.extend;


/**
* Expose Mongorito
*/

var exports = module.exports = Mongorito;

exports.Model = Model;

Object.keys(mongoskin).forEach(function (key) {
  if (["connect", "version", "db"].indexOf(key) === -1) {
    exports[key] = mongoskin[key];
  }
});

const emptyObject = {};
