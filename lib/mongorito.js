'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

/**
* Dependencies
*/

const ObjectID = require('monk/node_modules/mongoskin').ObjectID;

const mongoskin = require('monk/node_modules/mongoskin');
const pluralize = require('pluralize');
const compose = require('koa-compose');
const result = require('lodash.result');
const monk = require('monk');
const wrap = require('co-monk');
const is = require('is_js');

const Query = require('./query');
const util = require('./util');

/**
* Mongorito
*
* Main class, manages mongodb connection and collections
*/

var Mongorito = (function () {
  function Mongorito() {
    _classCallCheck(this, Mongorito);
  }

  /**
   * Connect to a MongoDB database and return connection object
   *
   * @param {String} urls - connection urls (as arguments)
   * @api public
   */

  Mongorito.connect = function connect() {
    for (var _len = arguments.length, urls = Array(_len), _key = 0; _key < _len; _key++) {
      urls[_key] = arguments[_key];
    }

    // convert mongo:// urls to monk-supported ones
    urls = urls.map(function (url) {
      return url.replace(/^mongo\:\/\//, '');
    });

    var db = monk.apply(undefined, urls);

    // if there is already a connection
    // don't overwrite it with a new one
    if (!this.db) this.db = db;

    return db;
  };

  /**
   * Disconnect from a database
   *
   * @api public
   */

  Mongorito.disconnect = function disconnect() {
    this.db.close();
  };

  /**
   * Alias for .disconnect()
   *
   * @api public
   */

  Mongorito.close = function close() {
    return this.disconnect.apply(this, arguments);
  };

  /**
   * Return a co-wrapped monk collection
   *
   * @api private
   */

  Mongorito._collection = function _collection(db, name) {
    var url = db.driver._connect_args[0];
    var collections = this._collections[url];

    if (!collections) {
      collections = this._collections[url] = {};
    }

    if (collections[name]) {
      return collections[name];
    }var collection = db.get(name);
    collections[name] = wrap(collection);

    return collections[name];
  };

  return Mongorito;
})();

/**
 * Cache for monk collections
 *
 * @api private
 */

Mongorito._collections = {};

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
    Object.defineProperty(this, '_hooks', {
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

  /**
   * Get model attribute
   *
   * @param {String} key - property name
   * @api public
   */

  Model.prototype.get = function get(key) {
    var attrs = this.attributes;

    // if key is not set
    // return all attributes
    return key ? attrs[key] : attrs;
  };

  /**
   * Set model attribute
   *
   * @param {String} key - property name
   * @param {Mixed} value - property value
   * @api public
   */

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

      if (typeof _ret === 'object') {
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

  /**
   * Set default values
   *
   * @api private
   */

  Model.prototype._setDefaults = function _setDefaults() {
    var _this2 = this;

    var defaults = result(this, 'defaults', {});
    var keys = Object.keys(defaults);

    keys.forEach(function (key) {
      var defaultValue = defaults[key];
      var actualValue = _this2.get(key);

      if (is.undefined(actualValue)) {
        _this2.set(key, defaultValue);
      }
    });
  };

  /**
   * Get all attributes
   *
   * @api public
   */

  Model.prototype.toJSON = function toJSON() {
    return this.attributes;
  };

  /**
   * Configure model (usually, set hooks here)
   * Supposed to be overriden
   *
   * @api public
   */

  Model.prototype.configure = function configure() {};

  /**
   * Rollback given method when error occurs
   * Supposed to be overriden
   *
   * @param {String} name - method name
   * @api public
   */

  Model.prototype.rollback = function* rollback() {};

  /**
   * Return a function, that in case of an error
   * executes this.rollback() with a given method name
   *
   * @api private
   */

  Model.prototype._rollbackFor = function _rollbackFor(method) {
    return function* (next) {
      try {
        yield* next;
      } catch (err) {
        yield this.rollback(method);
        throw err;
      }
    };
  };

  /**
   * Add hooks
   *
   * @api private
   */

  Model.prototype.hook = function hook(when, action, method) {
    var _this3 = this;

    // if object is given
    // iterate and call .hook()
    // for each entry
    if (is.object(when)) {
      var _ret2 = (function () {
        var hooks = when;
        var keys = Object.keys(hooks);

        keys.forEach(function (key) {
          var _key$split = key.split(':');

          var when = _key$split[0];
          var action = _key$split[1];

          var method = hooks[key];

          _this3.hook(when, action, method);
        });

        return {
          v: undefined
        };
      })();

      if (typeof _ret2 === 'object') {
        return _ret2.v;
      }
    }

    // if array is given
    // iterate and call .hook()
    // for each item
    if (is.array(method)) {
      var _methods = method;

      _methods.forEach(function (method) {
        return _this3.hook(when, action, method);
      });

      return;
    }

    // if method is a string
    // get the function
    if (is.not['function'](method)) method = this[method];

    // around hooks should be
    // at the end of before:*
    // at the beginning of after:*
    if (when === 'around') {
      this._hooks.before[action].push(method);
      this._hooks.after[action].unshift(method);
    } else {
      this._hooks[when][action].push(method);
    }
  };

  /**
   * Add multiple hooks at once
   *
   * @api public
   */

  Model.prototype.hooks = function hooks() {
    return this.hook.apply(this, arguments);
  };

  /**
   * Add before:* hook
   *
   * @param {String} action - before what
   * @param {String} method - hook name
   * @api public
   */

  Model.prototype.before = function before(action, method) {
    this.hook('before', action, method);
  };

  /**
   * Add after:* hook
   *
   * @param {String} action - after what
   * @param {String} method - hook name
   * @api public
   */

  Model.prototype.after = function after(action, method) {
    this.hook('after', action, method);
  };

  /**
   * Add around:* hook
   *
   * @param {String} action - around what
   * @param {String} method - hook name
   * @api public
   */

  Model.prototype.around = function around(action, method) {
    this.hook('around', action, method);
  };

  /**
   * Execute hooks
   *
   * @api private
   */

  Model.prototype._runHooks = function _runHooks(when, action) {
    var _this4 = this;

    var options = arguments[2] === undefined ? {} : arguments[2];

    var hooks = this._getHooks(when, action);

    // skip hooks
    var skip = options.skip;

    if (skip) {
      if (is.string(skip)) skip = [skip];

      hooks = hooks.filter(function (fn) {
        return skip.indexOf(fn.name) === -1;
      });
    }

    var middleware = [];

    // insert a rollback fn
    // before each hook
    hooks.forEach(function (fn) {
      var rollback = _this4._rollbackFor(fn.name);

      middleware.push(rollback, fn);
    });

    return compose(middleware).call(this);
  };

  /**
   * Get hooks for a given operation
   *
   * @api private
   */

  Model.prototype._getHooks = function _getHooks(when, action) {
    var hooks = this._hooks[when][action] || [];

    // if create or update hooks requested
    // prepend save hooks also
    if (action === 'create' || action === 'update') {
      hooks.push.apply(hooks, this._hooks[when].save);
    }

    return hooks;
  };

  /**
   * Save a model
   *
   * @param {Object} options - options for save operation
   * @api public
   */

  Model.prototype.save = function* save(options) {
    var _this5 = this;

    // set default values if needed
    this._setDefaults();

    var id = this.get('_id');
    var fn = id ? this.update : this.create;

    // revert populated documents to _id's
    var populate = this.options.populate || emptyObject;
    var keys = Object.keys(populate);

    keys.forEach(function (key) {
      var value = _this5.get(key);

      if (is.array(value)) {
        value = value.map(function (doc) {
          return doc.get('_id');
        });
      } else {
        value = value.get('_id');
      }

      _this5.set(key, value);
    });

    return yield fn.call(this, options);
  };

  /**
   * Create a model
   *
   * @api private
   */

  Model.prototype.create = function* create(options) {
    var collection = this._collection;
    var attrs = this.attributes;

    var date = new Date();
    this.set({
      created_at: date,
      updated_at: date
    });

    yield* this._runHooks('before', 'create', options);

    var doc = yield collection.insert(attrs);
    this.set('_id', doc._id);

    yield* this._runHooks('after', 'create', options);

    return this;
  };

  /**
   * Update a model
   *
   * @api private
   */

  Model.prototype.update = function* update(options) {
    var collection = this._collection;
    var attrs = this.attributes;

    this.set('updated_at', new Date());

    yield* this._runHooks('before', 'update', options);
    yield collection.updateById(attrs._id, attrs);
    yield* this._runHooks('after', 'update', options);

    return this;
  };

  /**
   * Remove a model
   *
   * @api private
   */

  Model.prototype.remove = function* remove(options) {
    var collection = this._collection;

    yield* this._runHooks('before', 'remove', options);
    yield collection.remove({ _id: this.get('_id') });
    yield* this._runHooks('after', 'remove', options);

    return this;
  };

  /**
   * Atomically increment a model property
   *
   * @param {Object} props - set of properties and values
   * @param {Object} options - options for update operation
   * @api public
   */

  Model.prototype.inc = function* inc(props, options) {
    var _this6 = this;

    var id = this.get('_id');

    if (!id) {
      throw new Error('Can\'t atomically increment a property of unsaved document.');
    }

    var collection = this._collection;

    yield* this._runHooks('before', 'update', options);

    yield collection.updateById(id, {
      $inc: props
    });

    // perform increment locally
    // to prevent the need to refresh
    // the model from a database
    Object.keys(props).forEach(function (key) {
      // get current value
      var value = _this6.get(key);

      // perform increment
      value += props[key];

      // save
      _this6.set(key, value);
    });

    yield* this._runHooks('after', 'update', options);

    return this;
  };

  /**
   * Find documents
   *
   * @param {Object} query - find conditions, same as this.where()
   * @api public
   */

  Model.find = function find(query) {
    return new Query(this._collection, this).find(query); // collection, model
  };

  /**
   * Count documents
   *
   * @param {Object} query - find conditions, same as this.where()
   * @api public
   */

  Model.count = function count(query) {
    return new Query(this._collection, this).count(query); // collection, model
  };

  /**
   * Find all documents in a collection
   *
   * @api public
   */

  Model.all = function all() {
    return this.find();
  };

  /**
   * Find one document
   *
   * @param {Object} query - find conditions, same as this.where()
   * @api public
   */

  Model.findOne = function* findOne(query) {
    var docs = yield* this.find(query);

    return docs[0];
  };

  /**
   * Find a document by ID
   *
   * @param {ObjectID} id - document id
   * @api public
   */

  Model.findById = function findById(id) {
    return this.findOne({ _id: id });
  };

  /**
   * Remove documents
   *
   * @param {Object} query - remove conditions, same as this.where()
   * @api public
   */

  Model.remove = function remove(query) {
    return new Query(this._collection, this).remove(query); // collection, model
  };

  /**
   * Set up an index
   *
   * @see https://github.com/Automattic/monk#indexes
   * @api public
   */

  Model.index = function* index() {
    var _collection;

    return yield (_collection = this._collection).index.apply(_collection, arguments);
  };

  /**
   * List all indexes
   *
   * @see https://github.com/Automattic/monk#indexes
   * @api public
   */

  Model.indexes = function* indexes() {
    return yield this._collection.indexes();
  };

  _createClass(Model, [{
    key: '_collection',

    /**
     * Get collection for current model
     *
     * @api private
     */

    get: function () {
      if (is.string(this.collection)) {
        return Mongorito._collection(this._db, this.collection);
      }

      // get collectio name
      // from the "collection" property
      // or generate the default one
      var defaultName = pluralize(this.constructor.name).toLowerCase();
      var name = result(this, 'collection', defaultName);

      // save collection name
      // to avoid the same check in future
      this.collection = this.constructor.prototype.collection = name;

      return Mongorito._collection(this._db, this.collection);
    }
  }, {
    key: '_db',

    /**
     * Get database for current model
     *
     * @api private
     */

    get: function () {
      // use either custom database
      // specified for this model
      // or use a default one
      return this.db || Mongorito.db;
    }
  }], [{
    key: '_db',

    /**
     * Get database for a model
     *
     * @api private
     */

    get: function () {
      // support for multiple connections
      // if model has a custom database assigned
      // use it, otherwise use the default
      return this.prototype.db || Mongorito.db;
    }
  }, {
    key: '_collection',

    /**
     * Get collection for a model
     *
     * @api private
     */

    get: function () {
      if (is.string(this.prototype.collection)) {
        return Mongorito._collection(this._db, this.prototype.collection);
      }

      // get collection name
      // from the "collection" property
      // or generate the default one
      var defaultName = pluralize(this.name).toLowerCase();
      var name = result(this.prototype, 'collection', defaultName);

      // save collection name
      // to avoid the same check in future
      this.prototype.collection = name;

      return Mongorito._collection(this._db, name);
    }
  }]);

  return Model;
})();

// Setting up functions that have
// the same implementation
// and act as a bridge to Query
const methods = ['where', 'limit', 'skip', 'sort', 'exists', 'lt', 'lte', 'gt', 'gte', 'in', 'nin', 'and', 'or', 'ne', 'nor', 'populate'];

methods.forEach(function (method) {
  Model[method] = function () {
    var query = new Query(this._collection, this); // collection, model
    query[method].apply(query, arguments);

    return query;
  };
});

/**
 * Backwards compatibility for ES5-ish way of defining models
 */

Model.extend = require('./extend')(Model);

/**
* Expose Mongorito
*/

var _exports = module.exports = Mongorito;

_exports.Model = Model;

Object.keys(mongoskin).forEach(function (key) {
  if (['connect', 'version', 'db'].indexOf(key) === -1) {
    _exports[key] = mongoskin[key];
  }
});

const emptyObject = {};
