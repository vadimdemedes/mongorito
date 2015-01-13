"use strict";

var _defineProperty = function (obj, key, value) {
  return Object.defineProperty(obj, key, {
    value: value,
    enumerable: true,
    configurable: true,
    writable: true
  });
};

/**
* Module dependencies
*/

var util = require("./util");

var isObjectID = util.isObjectID;
var isRegExp = util.isRegExp;
var isObject = util.isObject;
var isString = util.isString;
var isArray = util.isArray;



/**
* Query
*/

var Query = function Query(collection, model, key) {
  this.collection = collection;
  this.model = model;
  this.query = {};
  this.options = { populate: {} };
  this.lastKey = key;
};

Query.prototype.where = function (key, value) {
  var _this = this;
  // if object was passed instead of key-value pair
  // iterate over that object and call .where(key, value)
  if (isObject(key)) {
    (function () {
      var conditions = key;
      var keys = Object.keys(conditions);

      keys.forEach(function (key) {
        return _this.where(key, conditions[key]);
      });
    })();
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
};

Query.prototype.limit = function (limit) {
  this.options.limit = limit;

  return this;
};

Query.prototype.skip = function (skip) {
  this.options.skip = skip;

  return this;
};

Query.prototype.sort = function (sort) {
  this.options.sort = sort;

  return this;
};

Query.prototype.equals = function (value) {
  var key = this.lastKey;
  this.lastKey = null;

  this.query[key] = value;

  return this;
};

Query.prototype.exists = function (key, exists) {
  if (this.lastKey) {
    exists = key;
    key = this.lastKey;
    this.lastKey = null;
  }

  this.query[key] = { $exists: exists || true };

  return this;
};

Query.prototype.populate = function (key, model) {
  this.options.populate[key] = model;

  return this;
};

Query.prototype.count = function* (query) {
  this.where(query);

  var collection = this.collection;
  var model = this.model;

  var _count = collection.count(this.query);

  return yield _count;
};

Query.prototype.find = function* (query) {
  this.where(query);

  var collection = this.collection;
  var model = this.model;
  var options = this.options;

  // fields to populate
  var _populate = Object.keys(options.populate);

  var docs = yield collection.find(this.query, options);

  var i = 0;
  var doc = undefined;

  while (doc = docs[i++]) {
    // options.populate is a key-model pair object
    var j = 0;
    var key = undefined;

    while (key = _populate[j++]) {
      // model to use when populating the field
      var _model = options.populate[key];

      var value = doc[key];

      // if value is an array of IDs, loop through it
      if (isArray(value)) {
        // convert each _id
        // to findById op
        var subdocs = value.map(_model.findById, _model);

        // find sub documents
        value = yield subdocs;
      } else {
        value = yield _model.findById(value);
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
};

Query.prototype.findOne = function* (query) {
  var docs = yield this.find(query);

  return docs[0];
};

Query.prototype.remove = function* (query) {
  this.where(query);

  var collection = this.collection;
  var model = this.model;

  return yield collection.remove(this.query, this.options);
};

// Setting up functions that
// have the same implementation
var methods = ["lt", "lte", "gt", "gte", "in", "nin", "and", "or", "ne", "nor"];

methods.forEach(function (method) {
  Query.prototype[method] = function (key, value) {
    // if .where() was called with one argument
    // key was already set in this.lastKey
    if (this.lastKey) {
      value = key;
      key = this.lastKey;
      this.lastKey = null;
    }

    this.query[key] = _defineProperty({}, "$" + method, value);

    return this;
  };
});

module.exports = Query;
