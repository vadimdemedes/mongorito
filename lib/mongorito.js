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
var result = require("lodash.result");
var monk = require("monk");
var wrap = require("co-monk");
var util = require("./util");
var is = require("is_js");


/**
* Mongorito
*
* Main class, manages mongodb connection and collections
*/

var Mongorito = (function () {
  function Mongorito() {
    _classCallCheck(this, Mongorito);
  }

  _prototypeProperties(Mongorito, {
    connect: {
      value: function connect() {
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
      },
      writable: true,
      configurable: true
    },
    disconnect: {
      value: function disconnect() {
        this.db.close();
      },
      writable: true,
      configurable: true
    },
    close: {
      value: function close() {
        return this.disconnect.apply(this, arguments);
      },
      writable: true,
      configurable: true
    },
    collection: {
      value: function collection(db, name) {
        var url = db.driver._connect_args[0];
        var collections = this.collections[url];

        if (!collections) {
          collections = this.collections[url] = {};
        }

        if (collections[name]) {
          return collections[name];
        }var collection = db.get(name);
        return collections[name] = wrap(collection);
      },
      writable: true,
      configurable: true
    }
  });

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

  _prototypeProperties(Model, {
    _collection: {
      value: function _collection() {
        var name = result(this.prototype, "collection", pluralize(this.name).toLowerCase());

        if (!this.prototype.collection) {
          this.prototype.collection = name;
        }

        // support for multiple connections
        // if model has a custom database assigned
        // use it, otherwise use the default
        var db = this.prototype.db || Mongorito.db;

        return Mongorito.collection(db, name);
      },
      writable: true,
      configurable: true
    },
    find: {
      value: regeneratorRuntime.mark(function find(query) {
        var _this = this;
        var collection, model, q;
        return regeneratorRuntime.wrap(function find$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              collection = _this._collection();
              model = _this;
              q = new Query(collection, model).find(query);
              context$2$0.next = 5;
              return q;
            case 5:
              return context$2$0.abrupt("return", context$2$0.sent);
            case 6:
            case "end":
              return context$2$0.stop();
          }
        }, find, this);
      }),
      writable: true,
      configurable: true
    },
    count: {
      value: regeneratorRuntime.mark(function count(query) {
        var _this = this;
        var collection, model, count;
        return regeneratorRuntime.wrap(function count$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              collection = _this._collection();
              model = _this;
              count = new Query(collection, model).count(query);
              context$2$0.next = 5;
              return count;
            case 5:
              return context$2$0.abrupt("return", context$2$0.sent);
            case 6:
            case "end":
              return context$2$0.stop();
          }
        }, count, this);
      }),
      writable: true,
      configurable: true
    },
    all: {
      value: regeneratorRuntime.mark(function all() {
        var _this = this;
        return regeneratorRuntime.wrap(function all$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              context$2$0.next = 2;
              return _this.find();
            case 2:
              return context$2$0.abrupt("return", context$2$0.sent);
            case 3:
            case "end":
              return context$2$0.stop();
          }
        }, all, this);
      }),
      writable: true,
      configurable: true
    },
    findOne: {
      value: regeneratorRuntime.mark(function findOne(query) {
        var _this = this;
        var docs;
        return regeneratorRuntime.wrap(function findOne$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              context$2$0.next = 2;
              return _this.find(query);
            case 2:
              docs = context$2$0.sent;
              return context$2$0.abrupt("return", docs[0]);
            case 4:
            case "end":
              return context$2$0.stop();
          }
        }, findOne, this);
      }),
      writable: true,
      configurable: true
    },
    findById: {
      value: regeneratorRuntime.mark(function findById(id) {
        var _this = this;
        return regeneratorRuntime.wrap(function findById$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              context$2$0.next = 2;
              return _this.findOne({ _id: id });
            case 2:
              return context$2$0.abrupt("return", context$2$0.sent);
            case 3:
            case "end":
              return context$2$0.stop();
          }
        }, findById, this);
      }),
      writable: true,
      configurable: true
    },
    remove: {
      value: regeneratorRuntime.mark(function remove(query) {
        var _this = this;
        var collection, model;
        return regeneratorRuntime.wrap(function remove$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              collection = _this._collection();
              model = _this;
              query = new Query(collection, model).remove(query);
              context$2$0.next = 5;
              return query;
            case 5:
              return context$2$0.abrupt("return", context$2$0.sent);
            case 6:
            case "end":
              return context$2$0.stop();
          }
        }, remove, this);
      }),
      writable: true,
      configurable: true
    },
    index: {
      value: regeneratorRuntime.mark(function index() {
        var _this = this;
        var _arguments = arguments;
        var collection;
        return regeneratorRuntime.wrap(function index$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              collection = _this._collection();
              context$2$0.next = 3;
              return collection.index.apply(collection, _arguments);
            case 3:
              return context$2$0.abrupt("return", context$2$0.sent);
            case 4:
            case "end":
              return context$2$0.stop();
          }
        }, index, this);
      }),
      writable: true,
      configurable: true
    },
    indexes: {
      value: regeneratorRuntime.mark(function indexes() {
        var _this = this;
        var collection;
        return regeneratorRuntime.wrap(function indexes$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              collection = _this._collection();
              context$2$0.next = 3;
              return collection.indexes();
            case 3:
              return context$2$0.abrupt("return", context$2$0.sent);
            case 4:
            case "end":
              return context$2$0.stop();
          }
        }, indexes, this);
      }),
      writable: true,
      configurable: true
    },
    id: {
      value: function id() {
        var collection = this._collection();

        return collection.id.apply(collection, arguments);
      },
      writable: true,
      configurable: true
    }
  }, {
    _collection: {
      get: function () {
        var name = result(this, "collection", pluralize(this.constructor.name).toLowerCase());

        if (!this.collection) {
          this.collection = this.constructor.prototype.collection = name;
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
    },
    get: {
      value: function get(key) {
        var attrs = this.attributes;

        return key ? attrs[key] : attrs;
      },
      writable: true,
      configurable: true
    },
    set: {
      value: function set(key, value) {
        var _this = this;
        // if object passed instead of key-value pair
        // iterate and call set on each item
        if (is.object(key)) {
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

        // check if the value actually changed
        if (this.get(key) !== value) {
          this.previous[key] = this.get(key);
          this.attributes[key] = value;
          this.changed[key] = true;
        }

        return value;
      },
      writable: true,
      configurable: true
    },
    setDefaults: {
      value: function setDefaults() {
        var _this = this;
        var defaults = this.defaults || {};
        var keys = Object.keys(defaults);

        keys.forEach(function (key) {
          var defaultValue = defaults[key];
          var actualValue = _this.get(key);

          if (is.undefined(actualValue)) {
            _this.set(key, defaultValue);
          }
        });
      },
      writable: true,
      configurable: true
    },
    toJSON: {
      value: function toJSON() {
        return this.attributes;
      },
      writable: true,
      configurable: true
    },
    configure: {
      value: function configure() {},
      writable: true,
      configurable: true
    },
    hook: {
      value: function hook(when, action, method) {
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
      },
      writable: true,
      configurable: true
    },
    hooks: {
      value: function hooks() {
        return this.hook.apply(this, arguments);
      },
      writable: true,
      configurable: true
    },
    before: {
      value: function before(action, method) {
        this.hook("before", action, method);
      },
      writable: true,
      configurable: true
    },
    after: {
      value: function after(action, method) {
        this.hook("after", action, method);
      },
      writable: true,
      configurable: true
    },
    around: {
      value: function around(action, method) {
        this.hook("around", action, method);
      },
      writable: true,
      configurable: true
    },
    runHooks: {
      value: regeneratorRuntime.mark(function runHooks(when, action) {
        var _this = this;
        var options = arguments[2] === undefined ? {} : arguments[2];
        var hooks, skip;
        return regeneratorRuntime.wrap(function runHooks$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              hooks = _this._hooks[when][action];
              skip = options.skip;


              if (skip) {
                if (is.string(skip)) skip = [skip];

                hooks = hooks.filter(function (fn) {
                  return skip.indexOf(fn.name) === -1;
                });
              }

              context$2$0.next = 5;
              return compose(hooks).call(_this);
            case 5:
            case "end":
              return context$2$0.stop();
          }
        }, runHooks, this);
      }),
      writable: true,
      configurable: true
    },
    save: {
      value: regeneratorRuntime.mark(function save(options) {
        var _this = this;
        var id, fn, populate, keys, result;
        return regeneratorRuntime.wrap(function save$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              // set default values if needed
              _this.setDefaults();

              id = _this.get("_id");
              fn = id ? _this.update : _this.create;
              populate = _this.options.populate || emptyObject;
              keys = Object.keys(populate);


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

              context$2$0.next = 8;
              return _this.runHooks("before", "save", options);
            case 8:
              context$2$0.next = 10;
              return fn.call(_this, options);
            case 10:
              result = context$2$0.sent;
              context$2$0.next = 13;
              return _this.runHooks("after", "save", options);
            case 13:
              return context$2$0.abrupt("return", result);
            case 14:
            case "end":
              return context$2$0.stop();
          }
        }, save, this);
      }),
      writable: true,
      configurable: true
    },
    create: {
      value: regeneratorRuntime.mark(function create(options) {
        var _this = this;
        var collection, attrs, date, doc;
        return regeneratorRuntime.wrap(function create$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              collection = _this._collection;
              attrs = _this.attributes;
              date = new Date();
              _this.set({
                created_at: date,
                updated_at: date
              });

              context$2$0.next = 6;
              return _this.runHooks("before", "create", options);
            case 6:
              context$2$0.next = 8;
              return collection.insert(attrs);
            case 8:
              doc = context$2$0.sent;
              _this.set("_id", doc._id);

              context$2$0.next = 12;
              return _this.runHooks("after", "create", options);
            case 12:
              return context$2$0.abrupt("return", _this);
            case 13:
            case "end":
              return context$2$0.stop();
          }
        }, create, this);
      }),
      writable: true,
      configurable: true
    },
    update: {
      value: regeneratorRuntime.mark(function update(options) {
        var _this = this;
        var collection, attrs;
        return regeneratorRuntime.wrap(function update$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              collection = _this._collection;
              attrs = _this.attributes;


              _this.set("updated_at", new Date());

              context$2$0.next = 5;
              return _this.runHooks("before", "update", options);
            case 5:
              context$2$0.next = 7;
              return collection.updateById(attrs._id, attrs);
            case 7:
              context$2$0.next = 9;
              return _this.runHooks("after", "update", options);
            case 9:
              return context$2$0.abrupt("return", _this);
            case 10:
            case "end":
              return context$2$0.stop();
          }
        }, update, this);
      }),
      writable: true,
      configurable: true
    },
    remove: {
      value: regeneratorRuntime.mark(function remove(options) {
        var _this = this;
        var collection;
        return regeneratorRuntime.wrap(function remove$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              collection = _this._collection;
              context$2$0.next = 3;
              return _this.runHooks("before", "remove", options);
            case 3:
              context$2$0.next = 5;
              return collection.remove({ _id: _this.get("_id") });
            case 5:
              context$2$0.next = 7;
              return _this.runHooks("after", "remove", options);
            case 7:
              return context$2$0.abrupt("return", _this);
            case 8:
            case "end":
              return context$2$0.stop();
          }
        }, remove, this);
      }),
      writable: true,
      configurable: true
    },
    inc: {
      value: regeneratorRuntime.mark(function inc(props, options) {
        var _this = this;
        var id, collection;
        return regeneratorRuntime.wrap(function inc$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              id = _this.get("_id");
              if (id) {
                context$2$0.next = 3;
                break;
              }
              throw new Error("Can't atomically increment a property of unsaved document.");
            case 3:
              collection = _this._collection;
              context$2$0.next = 6;
              return _this.runHooks("before", "save", options);
            case 6:
              context$2$0.next = 8;
              return _this.runHooks("before", "update", options);
            case 8:
              context$2$0.next = 10;
              return collection.updateById(id, {
                $inc: props
              });
            case 10:


              Object.keys(props).forEach(function (key) {
                // get current value
                var value = _this.get(key);

                // perform increment
                value += props[key];

                // save
                _this.set(key, value);
              });

              context$2$0.next = 13;
              return _this.runHooks("after", "update", options);
            case 13:
              context$2$0.next = 15;
              return _this.runHooks("after", "save", options);
            case 15:
              return context$2$0.abrupt("return", _this);
            case 16:
            case "end":
              return context$2$0.stop();
          }
        }, inc, this);
      }),
      writable: true,
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

exports.Model = Model;

var mongoskin = require("monk/node_modules/mongoskin");

Object.keys(mongoskin).forEach(function (key) {
  if (["connect", "version", "db"].indexOf(key) === -1) exports[key] = mongoskin[key];
});

var emptyObject = {};


// skip middleware


// revert populated documents to _id's
