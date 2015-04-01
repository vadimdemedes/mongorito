/**
* Dependencies
*/

const ObjectID = require('monk/node_modules/mongoskin').ObjectID;
const Class = require('class-extend');

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
  static connect (...urls) {
    // convert mongo:// urls to monk-supported ones
    urls = urls.map(url => url.replace(/^mongo\:\/\//, ''));

    let db = monk(...urls);

    // if there is already a connection
    // don't overwrite it with a new one
    if (!this.db) this.db = db;

    return db;
  }

  static disconnect () {
    this.db.close();
  }

  static close () {
    return this.disconnect(...arguments);
  }

  static collection (db, name) {
    let url = db.driver._connect_args[0];
    let collections = this.collections[url];

    if (!collections) {
      collections = this.collections[url] = {};
    }

    if (collections[name]) return collections[name];

    let collection = db.get(name);
    collections[name] = wrap(collection);
    
    return collections[name];
  }
}

Mongorito.collections = {};


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
    if (is.string(this.collection)) {
      return Mongorito.collection(this._db, this.collection);
    }
    
    // get collectio name
    // from the "collection" property
    // or generate the default one
    let defaultName = pluralize(this.constructor.name).toLowerCase();
    let name = result(this, 'collection', defaultName);

    // save collection name
    // to avoid the same check in future
    this.collection = this.constructor.prototype.collection = name;

    return Mongorito.collection(this._db, this.collection);
  }

  get _db () {
    // use either custom database
    // specified for this model
    // or use a default one
    return this.db || Mongorito.db;
  }

  get (key) {
    let attrs = this.attributes;

    // if key is not set
    // return all attributes
    return key ? attrs[key] : attrs;
  }

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

  setDefaults () {
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

  toJSON () {
    return this.attributes;
  }

  configure () {

  }

  hook (when, action, method) {
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

    if (is.array(method)) {
      let methods = method;

      methods.forEach(method => this.hook(when, action, method));

      return;
    }

    if (is.not.function(method)) method = this[method];

    if (when === 'around') {
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

  * runHooks (when, action, options = {}) {
    let hooks = this._hooks[when][action];
    
    // skip middleware
    let skip = options.skip;
    
    if (skip) {
      if (is.string(skip)) skip = [skip];
      
      hooks = hooks.filter(fn => skip.indexOf(fn.name) === -1);
    }

    yield compose(hooks);
  }

  * save (options) {
    // set default values if needed
    this.setDefaults();

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

    yield* this.runHooks('before', 'save', options);
    let result = yield fn.call(this, options);
    yield* this.runHooks('after', 'save', options);

    return result;
  }

  * create (options) {
    let collection = this._collection;
    let attrs = this.attributes;

    let date = new Date;
    this.set({
      created_at: date,
      updated_at: date
    });

    yield* this.runHooks('before', 'create', options);

    let doc = yield collection.insert(attrs);
    this.set('_id', doc._id);

    yield* this.runHooks('after', 'create', options);

    return this;
  }

  * update (options) {
    let collection = this._collection;
    let attrs = this.attributes;

    this.set('updated_at', new Date);

    yield* this.runHooks('before', 'update', options);
    yield collection.updateById(attrs._id, attrs);
    yield* this.runHooks('after', 'update', options);

    return this;
  }

  * remove (options) {
    let collection = this._collection;

    yield* this.runHooks('before', 'remove', options);
    yield collection.remove({ _id: this.get('_id') });
    yield* this.runHooks('after', 'remove', options);

    return this;
  }

  * inc (props, options) {
    let id = this.get('_id');

    if (!id) {
      throw new Error('Can\'t atomically increment a property of unsaved document.');
    }

    let collection = this._collection;

    yield* this.runHooks('before', 'save', options);
    yield* this.runHooks('before', 'update', options);

    yield collection.updateById(id, {
      '$inc': props
    });

    Object.keys(props).forEach(key => {
      // get current value
      let value = this.get(key);

      // perform increment
      value += props[key];

      // save
      this.set(key, value);
    });

    yield* this.runHooks('after', 'update', options);
    yield* this.runHooks('after', 'save', options);

    return this;
  }
  
  static get _db () {
    // support for multiple connections
    // if model has a custom database assigned
    // use it, otherwise use the default
    return this.prototype.db || Mongorito.db;
  }

  static get _collection () {
    if (is.string(this.prototype.collection)) {
      return Mongorito.collection(this._db, this.prototype.collection);
    }
    
    // get collection name
    // from the "collection" property
    // or generate the default one
    let defaultName = pluralize(this.name).toLowerCase()
    let name = result(this.prototype, 'collection', defaultName);

    // save collection name
    // to avoid the same check in future
    this.prototype.collection = name;

    return Mongorito.collection(this._db, name);
  }

  static find (conditions) {
    let query = new Query(this._collection, this).find(conditions); // collection, model

    return query;
  }

  static count (query) {
    let count = new Query(this._collection, this).count(query); // collection, model

    return count;
  }

  static all () {
    return this.find();
  }

  static * findOne (query) {
    let docs = yield* this.find(query);

    return docs[0];
  }

  static findById (id) {
    return this.findOne({ _id: id });
  }

  static remove (query) {
    let query = new Query(this._collection, this).remove(query); // collection, model

    return query;
  }

  static * index () {
    return yield this._collection.index(...arguments)
  }

  static * indexes () {
    return yield this._collection.indexes();
  }

  static id () {
    return this._collection.id(...arguments);
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

Model.extend = Class.extend;


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
