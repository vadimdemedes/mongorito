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

class Mongorito {
  /**
   * Connect to a MongoDB database and return connection object
   *
   * @param {String} urls - connection urls (as arguments)
   * @api public
   */
   
  static connect (...urls) {
    // convert mongo:// urls to monk-supported ones
    urls = urls.map(url => url.replace(/^mongo\:\/\//, ''));

    let db = monk(...urls);

    // if there is already a connection
    // don't overwrite it with a new one
    if (!this.db) this.db = db;

    return db;
  }


  /**
   * Disconnect from a database
   *
   * @api public
   */
  
  static disconnect () {
    this.db.close();
  }


  /**
   * Alias for .disconnect()
   *
   * @api public
   */
  
  static close () {
    return this.disconnect(...arguments);
  }


  /**
   * Return a co-wrapped monk collection
   *
   * @api private
   */
  
  static _collection (db, name) {
    let url = db.driver._connect_args[0];
    let collections = this._collections[url];

    if (!collections) {
      collections = this._collections[url] = {};
    }

    if (collections[name]) return collections[name];

    let collection = db.get(name);
    collections[name] = wrap(collection);
    
    return collections[name];
  }
}


/**
 * Cache for monk collections
 *
 * @api private
 */

Mongorito._collections = {};


/**
* Model
*/

class Model {
  constructor (attrs = {}, options = {}) {
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
   * Get collection for current model
   *
   * @api private
   */
  
  get _collection () {
    if (is.string(this.collection)) {
      return Mongorito._collection(this._db, this.collection);
    }
    
    // get collectio name
    // from the "collection" property
    // or generate the default one
    let defaultName = pluralize(this.constructor.name).toLowerCase();
    let name = result(this, 'collection', defaultName);

    // save collection name
    // to avoid the same check in future
    this.collection = this.constructor.prototype.collection = name;

    return Mongorito._collection(this._db, this.collection);
  }

  
  /**
   * Get database for current model
   *
   * @api private
   */
  
  get _db () {
    // use either custom database
    // specified for this model
    // or use a default one
    return this.db || Mongorito.db;
  }


  /**
   * Get model attribute
   *
   * @param {String} key - property name
   * @api public
   */
  
  get (key) {
    let attrs = this.attributes;

    // if key is not set
    // return all attributes
    return key ? attrs[key] : attrs;
  }


  /**
   * Set model attribute
   *
   * @param {String} key - property name
   * @param {Mixed} value - property value
   * @api public
   */
  
  set (key, value) {
    // if object passed instead of key-value pair
    // iterate and call set on each item
    if (is.object(key)) {
      let attrs = key;
      let keys = Object.keys(attrs);

      keys.forEach(key => {
        this.set(key, attrs[key]);
      });

      return;
    }

    // check if the value actually changed
    if (this.get(key) !== value) {
      this.previous[key] = this.get(key);
      this.attributes[key] = value;
      this.changed[key] = true;
    }

    return value;
  }


  /**
   * Set default values
   *
   * @api private
   */
  
  _setDefaults () {
    let defaults = result(this, 'defaults', {});
    let keys = Object.keys(defaults);

    keys.forEach(key => {
      let defaultValue = defaults[key];
      let actualValue = this.get(key);

      if (is.undefined(actualValue)) {
        this.set(key, defaultValue);
      }
    });
  }


  /**
   * Get all attributes
   *
   * @api public
   */
  
  toJSON () {
    return this.attributes;
  }


  /**
   * Configure model (usually, set hooks here)
   * Supposed to be overriden
   *
   * @api public
   */
  
  configure () {

  }
  
  
  /**
   * Rollback given method when error occurs
   * Supposed to be overriden
   *
   * @param {String} name - method name
   * @api public
   */
  
  * rollback () {
    
  }
  
  
  /**
   * Return a function, that in case of an error
   * executes this.rollback() with a given method name
   *
   * @api private
   */
  
  _rollbackFor (method) {
    return function * (next) {
      try {
        yield* next;
      } catch (err) {
        yield this.rollback(method);
        throw err;
      }
    }
  }


  /**
   * Add hooks
   *
   * @api private
   */
  
  hook (when, action, method) {
    // if object is given
    // iterate and call .hook()
    // for each entry
    if (is.object(when)) {
      let hooks = when;
      let keys = Object.keys(hooks);

      keys.forEach(key => {
        let [when, action] = key.split(':');
        let method = hooks[key];

        this.hook(when, action, method);
      });

      return;
    }

    // if array is given
    // iterate and call .hook()
    // for each item
    if (is.array(method)) {
      let methods = method;

      methods.forEach(method => this.hook(when, action, method));

      return;
    }

    // if method is a string
    // get the function
    if (is.not.function(method)) method = this[method];

    // around hooks should be
    // at the end of before:*
    // at the beginning of after:*
    if (when === 'around') {
      this._hooks.before[action].push(method);
      this._hooks.after[action].unshift(method);
    } else {
      this._hooks[when][action].push(method);
    }
  }
  
  
  /**
   * Add multiple hooks at once
   *
   * @api public
   */
  
  hooks () {
    return this.hook.apply(this, arguments);
  }


  /**
   * Add before:* hook
   *
   * @param {String} action - before what
   * @param {String} method - hook name
   * @api public
   */
  
  before (action, method) {
    this.hook('before', action, method);
  }


  /**
   * Add after:* hook
   *
   * @param {String} action - after what
   * @param {String} method - hook name
   * @api public
   */
  after (action, method) {
    this.hook('after', action, method);
  }


  /**
   * Add around:* hook
   *
   * @param {String} action - around what
   * @param {String} method - hook name
   * @api public
   */
  around (action, method) {
    this.hook('around', action, method);
  }


  /**
   * Execute hooks
   *
   * @api private
   */
  
  _runHooks (when, action, options = {}) {
    let hooks = this._getHooks(when, action);
    
    // skip hooks
    let skip = options.skip;
    
    if (skip) {
      if (is.string(skip)) skip = [skip];
      
      hooks = hooks.filter(fn => skip.indexOf(fn.name) === -1);
    }
    
    let middleware = [];
    
    // insert a rollback fn
    // before each hook
    hooks.forEach(fn => {
      let rollback = this._rollbackFor(fn.name);
      
      middleware.push(rollback, fn);
    });

    return compose(middleware).call(this);
  }
  
  
  /**
   * Get hooks for a given operation
   *
   * @api private
   */
  
  _getHooks (when, action) {
    let hooks = this._hooks[when][action] || [];
    
    // if create or update hooks requested
    // prepend save hooks also
    if (action === 'create' || action === 'update') {
      hooks.push.apply(hooks, this._hooks[when]['save']);
    }
    
    return hooks;
  }


  /**
   * Save a model
   *
   * @param {Object} options - options for save operation
   * @api public
   */
  
  * save (options) {
    // set default values if needed
    this._setDefaults();

    let id = this.get('_id');
    let fn = id ? this.update : this.create;

    // revert populated documents to _id's
    let populate = this.options.populate || emptyObject;
    let keys = Object.keys(populate);

    keys.forEach(key => {
      let value = this.get(key);

      if (is.array(value)) {
        value = value.map(doc => doc.get('_id'));
      } else {
        value = value.get('_id');
      }

      this.set(key, value);
    });
    
    return yield fn.call(this, options);
  }


  /**
   * Create a model
   *
   * @api private
   */
  
  * create (options) {
    let collection = this._collection;
    let attrs = this.attributes;

    let date = new Date;
    this.set({
      created_at: date,
      updated_at: date
    });

    yield* this._runHooks('before', 'create', options);

    let doc = yield collection.insert(attrs);
    this.set('_id', doc._id);

    yield* this._runHooks('after', 'create', options);

    return this;
  }


  /**
   * Update a model
   *
   * @api private
   */
  
  * update (options) {
    let collection = this._collection;
    let attrs = this.attributes;

    this.set('updated_at', new Date);

    yield* this._runHooks('before', 'update', options);
    yield collection.updateById(attrs._id, attrs);
    yield* this._runHooks('after', 'update', options);

    return this;
  }


  /**
   * Remove a model
   *
   * @api private
   */
  
  * remove (options) {
    let collection = this._collection;

    yield* this._runHooks('before', 'remove', options);
    yield collection.remove({ _id: this.get('_id') });
    yield* this._runHooks('after', 'remove', options);

    return this;
  }


  /**
   * Atomically increment a model property
   *
   * @param {Object} props - set of properties and values
   * @param {Object} options - options for update operation
   * @api public
   */
  
  * inc (props, options) {
    let id = this.get('_id');

    if (!id) {
      throw new Error('Can\'t atomically increment a property of unsaved document.');
    }

    let collection = this._collection;
    
    yield* this._runHooks('before', 'update', options);

    yield collection.updateById(id, {
      '$inc': props
    });

    // perform increment locally
    // to prevent the need to refresh
    // the model from a database
    Object.keys(props).forEach(key => {
      // get current value
      let value = this.get(key);

      // perform increment
      value += props[key];

      // save
      this.set(key, value);
    });

    yield* this._runHooks('after', 'update', options);

    return this;
  }
  
  
  /**
   * Get database for a model
   *
   * @api private
   */
  
  static get _db () {
    // support for multiple connections
    // if model has a custom database assigned
    // use it, otherwise use the default
    return this.prototype.db || Mongorito.db;
  }


  /**
   * Get collection for a model
   *
   * @api private
   */
  
  static get _collection () {
    if (is.string(this.prototype.collection)) {
      return Mongorito._collection(this._db, this.prototype.collection);
    }
    
    // get collection name
    // from the "collection" property
    // or generate the default one
    let defaultName = pluralize(this.name).toLowerCase()
    let name = result(this.prototype, 'collection', defaultName);

    // save collection name
    // to avoid the same check in future
    this.prototype.collection = name;

    return Mongorito._collection(this._db, name);
  }

  
  /**
   * Find documents
   *
   * @param {Object} query - find conditions, same as this.where()
   * @api public
   */
  
  static find (query) {
    return new Query(this._collection, this).find(query); // collection, model
  }


  /**
   * Count documents
   *
   * @param {Object} query - find conditions, same as this.where()
   * @api public
   */
  
  static count (query) {
    return new Query(this._collection, this).count(query); // collection, model
  }

  
  /**
   * Find all documents in a collection
   *
   * @api public
   */
  
  static all () {
    return this.find();
  }


  /**
   * Find one document
   *
   * @param {Object} query - find conditions, same as this.where()
   * @api public
   */
  
  static * findOne (query) {
    let docs = yield* this.find(query);

    return docs[0];
  }


  /**
   * Find a document by ID
   *
   * @param {ObjectID} id - document id
   * @api public
   */
  
  static findById (id) {
    return this.findOne({ _id: id });
  }


  /**
   * Remove documents
   *
   * @param {Object} query - remove conditions, same as this.where()
   * @api public
   */
  
  static remove (query) {
    return new Query(this._collection, this).remove(query); // collection, model
  }


  /**
   * Set up an index
   *
   * @see https://github.com/Automattic/monk#indexes
   * @api public
   */
  
  static * index () {
    return yield this._collection.index(...arguments)
  }


  /**
   * List all indexes
   *
   * @see https://github.com/Automattic/monk#indexes
   * @api public
   */
  
  static * indexes () {
    return yield this._collection.indexes();
  }
}

// Setting up functions that have
// the same implementation
// and act as a bridge to Query
const methods = [
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

methods.forEach(method => {
  Model[method] = function () {
    let query = new Query(this._collection, this); // collection, model
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

var exports = module.exports = Mongorito;

exports.Model = Model;

Object.keys(mongoskin).forEach(key => {
  if (['connect', 'version', 'db'].indexOf(key) === -1) {
    exports[key] = mongoskin[key];
  }
});

const emptyObject = {};
