/**
* Module dependencies
*/

var util = require('./util');

var isObjectID = util.isObjectID;
var isRegExp = util.isRegExp;
var isObject = util.isObject;
var isString = util.isString;
var isArray = util.isArray;


/**
* Query
*/

class Query {
  constructor (collection, model, key) {
    this.collection = collection;
    this.model = model;
    this.query = {};
    this.options = { populate: {} };
    this.lastKey = key;
  }

  where (key, value) {
    // if object was passed instead of key-value pair
    // iterate over that object and call .where(key, value)
    if (isObject(key)) {
      let conditions = key;
      let keys = Object.keys(conditions);

      keys.forEach(key => this.where(key, conditions[key]));
    }

    if (isString(key)) {
      // if only one argument was supplied
      // save the key in this.lastKey
      // for future methods, like .equals()
      if (undefined == value) {
        this.lastKey = key;
        return this;
      }

      // 1. if regular expression
      // 2. if object and not ObjectID
      if (isRegExp(value)) {
        value = { $regex: value };
      } else if (isObject(value) && false === isObjectID(value)) {
        value = { $elemMatch: value };
      }

      this.query[key] = value;
    }

    return this;
  }

  limit (limit) {
    this.options.limit = limit;

    return this;
  }

  skip (skip) {
    this.options.skip = skip;

    return this;
  }

  sort (sort) {
    this.options.sort = sort;

    return this;
  }

  equals (value) {
    let key = this.lastKey;
    this.lastKey = null;

    this.query[key] = value;

    return this;
  }

  exists (key, exists) {
    if (this.lastKey) {
      exists = key;
      key = this.lastKey;
      this.lastKey = null;
    }

    this.query[key] = { $exists: exists || true };

    return this;
  }

  populate (key, model) {
    this.options.populate[key] = model;

    return this;
  }

  * count (query) {
    this.where(query);

    let collection = this.collection;
    let model = this.model;

    let count = collection.count(this.query);

    return yield count;
  }

  * find (query) {
    this.where(query);

    let collection = this.collection;
    let model = this.model;
    let options = this.options;

    // fields to populate
    let populate = Object.keys(options.populate);

    let docs = yield collection.find(this.query, options);

    let i = 0;
    let doc;

    while (doc = docs[i++]) {
      // options.populate is a key-model pair object
      let j = 0;
      let key;

      while (key = populate[j++]) {
        // model to use when populating the field
        let model = options.populate[key];

        let value = doc[key];

        // if value is an array of IDs, loop through it
        if (isArray(value)) {
          // convert each _id
          // to findById op
          let subdocs = value.map(model.findById, model);

          // find sub documents
          value = yield subdocs;
        } else {
          value = yield model.findById(value);
        }

        // replace previous ID with actual documents
        doc[key] = value;
      }

      // index - 1, because index here is already an index of the next document
      docs[i - 1] = new model(doc, {
        populate: options.populate
      });
    }

    return docs;
  }

  * findOne (query) {
    let docs = yield this.find(query);

    return docs[0];
  }

  * remove (query) {
    this.where(query);

    let collection = this.collection;
    let model = this.model;

    return yield collection.remove(this.query, this.options);
  }
}

// Setting up functions that
// have the same implementation
var methods = [
  'lt',
  'lte',
  'gt',
  'gte',
  'in',
  'nin',
  'and',
  'or',
  'ne',
  'nor'
];

methods.forEach(method => {
  Query.prototype[method] = function (key, value) {
    // if .where() was called with one argument
    // key was already set in this.lastKey
    if (this.lastKey) {
      value = key;
      key = this.lastKey;
      this.lastKey = null;
    }

    this.query[key] = {
      ['$' + method]: value
    };

    return this;
  }
});

module.exports = Query;
