/**
* Dependencies
*/

var ObjectID = require('monk/node_modules/mongoskin').ObjectID;
var Class = require('class-extend');

var pluralize = require('pluralize');
var compose = require('koa-compose');
var result = require('lodash.result');
var monk = require('monk');
var wrap = require('co-monk');
var util = require('./util');

var isFunction = require('lodash.isfunction');
var isObject = require('lodash.isobject');
var isArray = require('lodash.isarray');


/**
* Mongorito
* 
* Main class, manages mongodb connection and collections
*/

class Mongorito {
  static connect (...urls) {
    // convert mongo:// urls to monk-supported ones
    urls = urls.map(url => url.replace(/^mongo\:\/\//, ''));

    let db = monk.apply(null, urls);

    // if there is already a connection
    // don't overwrite it with a new one
    if (!this.db) this.db = db;

    return db;
  }

  static disconnect () {
    this.db.close();
  }

  static close () {
    return this.disconnect.apply(this, arguments);
  }

  static collection (db, name) {
    let url = db.driver._connect_args[0];
    let collections = this.collections[url];

    if (!collections) {
      collections = this.collections[url] = {};
    }

    if (collections[name]) return collections[name];

    let collection = db.get(name);
    return collections[name] = wrap(collection);
  }
}

Mongorito.collections = {};


/**
* Query
*/

var Query = require('./query');


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
  
  get _collection () {
    let name = result(this, 'collection', pluralize(this.constructor.name).toLowerCase());
    
    if (!this.collection) {
      this.collection = this.constructor.prototype.collection = name;
    }
    
    return Mongorito.collection(this._db, this.collection);
  }
  
  get _db () {
    return this.db || Mongorito.db
  }

  get (key) {
    let attrs = this.attributes;

    return key ? attrs[key] : attrs;
  }

  set (key, value) {
    // if object passed instead of key-value pair
    // iterate and call set on each item
    if (isObject(key)) {
      let attrs = key;
      let keys = Object.keys(attrs);

      keys.forEach(key => this.set(key, attrs[key]));

      return;
    }

    this.previous[key] = this.get(key);
    this.attributes[key] = value;
    this.changed[key] = value;

    return value;
  }

  setDefaults () {
    let defaults = this.defaults || {};
    let keys = Object.keys(defaults);
    
    keys.forEach(key => {
      let defaultValue = defaults[key];
      let actualValue = this.get(key);

      if (undefined == actualValue) {
        this.set(key, defaultValue);
      }
    });
  }

  toJSON () {
    return this.attributes;
  }

  configure () {

  }

  hook (when, action, method) {
    if (isObject(when)) {
      let hooks = when;
      let keys = Object.keys(hooks);

      keys.forEach(key => {
        let [when, action] = key.split(':');
        let method = hooks[key];

        this.hook(when, action, method);
      });

      return;
    }

    if (isArray(method)) {
      let methods = method;

      methods.forEach(method => this.hook(when, action, method));

      return;
    }

    if (false === isFunction(method)) method = this[method];

    if ('around' === when) {
      this._hooks.before[action].push(method);
      this._hooks.after[action].unshift(method);
    } else {
      this._hooks[when][action].push(method);
    }
  }
  
  hooks () {
    return this.hook.apply(this, arguments);
  }

  before (action, method) {
    this.hook('before', action, method);
  }

  after (action, method) {
    this.hook('after', action, method);
  }

  around (action, method) {
    this.hook('around', action, method);
  }

  * runHooks (when, action) {
    let hooks = this._hooks[when][action];

    yield compose(hooks).call(this);
  }

  * save () {
    // set default values if needed
    this.setDefaults();

    let id = this.get('_id');
    let fn = id ? this.update : this.create;

    // revert populated documents to _id's
    let populate = this.options.populate || emptyObject;
    let keys = Object.keys(populate);

    keys.forEach(key => {
      let value = this.get(key);

      if (isArray(value)) {
        value = value.map(doc => doc.get('_id'));
      } else {
        value = value.get('_id');
      }

      this.set(key, value);
    });

    yield this.runHooks('before', 'save');
    let result = yield fn.call(this);
    yield this.runHooks('after', 'save');

    return result;
  }

  * create () {
    let collection = this._collection;
    let attrs = this.attributes;

    let date = new Date;
    this.set({
      created_at: date,
      updated_at: date
    });

    yield this.runHooks('before', 'create');

    let doc = yield collection.insert(attrs);
    this.set('_id', doc._id);

    yield this.runHooks('after', 'create');

    return this;
  }

  * update () {
    let collection = this._collection;
    let attrs = this.attributes;
    
    this.set('updated_at', new Date);

    yield this.runHooks('before', 'update');
    yield collection.updateById(attrs._id, attrs);
    yield this.runHooks('after', 'update');

    return this;
  }

  * remove () {
    let collection = this._collection;

    yield this.runHooks('before', 'remove');
    yield collection.remove({ _id: this.get('_id') });
    yield this.runHooks('after', 'remove');

    return this;
  }

  static _collection () {
    let name = result(this.prototype, 'collection', pluralize(this.name).toLowerCase());
    
    if (!this.prototype.collection) {
      this.prototype.collection = name;
    }

    // support for multiple connections
    // if model has a custom database assigned
    // use it, otherwise use the default
    let db = this.prototype.db || Mongorito.db;

    return Mongorito.collection(db, name);
  }

  static * find (query) {
    let collection = this._collection();
    let model = this;

    let q = new Query(collection, model).find(query);

    return yield q;
  }

  static * count (query) {
    let collection = this._collection();
    let model = this;

    let count = new Query(collection, model).count(query);

    return yield count;
  }

  static * all () {
    return yield this.find();
  }

  static * findOne (query) {
    let docs = yield this.find(query);

    return docs[0];
  }

  static * findById (id) {
    return yield this.findOne({ _id: id });
  }

  static * remove (query) {
    let collection = this._collection();
    let model = this;

    let query = new Query(collection, model).remove(query);

    return yield query;
  }

  static * index () {
    let collection = this._collection();

    return yield collection.index.apply(collection, arguments);
  }

  static * indexes () {
    let collection = this._collection();

    return yield collection.indexes();
  }

  static id () {
    let collection = this._collection();

    return collection.id.apply(collection, arguments);
  }
}

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

methods.forEach(method => {
  Model[method] = function () {
    let collection = this._collection();
    let model = this;

    let query = new Query(collection, model);
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
