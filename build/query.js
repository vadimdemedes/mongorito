"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/**
* Module dependencies
*/

var isRegExp = require("lodash.isregexp");
var isObject = require("lodash.isobject");
var isString = require("lodash.isstring");
var isArray = require("lodash.isarray");

var util = require("./util");

var isObjectID = util.isObjectID;



/**
* Query
*/

var Query = (function () {
  function Query(collection, model, key) {
    _classCallCheck(this, Query);

    this.collection = collection;
    this.model = model;
    this.query = {};
    this.options = { populate: {} };
    this.lastKey = key;
  }

  Query.prototype.where = function where(key, value) {
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

  Query.prototype.limit = function limit(limit) {
    this.options.limit = limit;

    return this;
  };

  Query.prototype.skip = function skip(skip) {
    this.options.skip = skip;

    return this;
  };

  Query.prototype.sort = function sort(sort) {
    this.options.sort = sort;

    return this;
  };

  Query.prototype.equals = function equals(value) {
    var key = this.lastKey;
    this.lastKey = null;

    this.query[key] = value;

    return this;
  };

  Query.prototype.exists = function exists(key, exists) {
    if (this.lastKey) {
      exists = key;
      key = this.lastKey;
      this.lastKey = null;
    }

    this.query[key] = { $exists: exists || true };

    return this;
  };

  Query.prototype.populate = function populate(key, model) {
    this.options.populate[key] = model;

    return this;
  };

  Query.prototype.count = function* count(query) {
    this.where(query);

    var collection = this.collection;
    var model = this.model;

    var count = collection.count(this.query);

    return yield count;
  };

  Query.prototype.find = function* find(query) {
    this.where(query);

    var collection = this.collection;
    var model = this.model;
    var options = this.options;

    // fields to populate
    var populate = Object.keys(options.populate);

    var docs = yield collection.find(this.query, options);

    var i = 0;
    var doc = undefined;

    while (doc = docs[i++]) {
      // options.populate is a key-model pair object
      var j = 0;
      var key = undefined;

      while (key = populate[j++]) {
        // model to use when populating the field
        var childModel = options.populate[key];

        var value = doc[key];

        // if value is an array of IDs, loop through it
        if (isArray(value)) {
          // convert each _id
          // to findById op
          value = value.map(childModel.findById, childModel);
        } else {
          value = childModel.findById(value);
        }

        // replace previous ID with actual documents
        doc[key] = yield value;
      }

      // index - 1, because index here is already an index of the next document
      docs[i - 1] = new model(doc, {
        populate: options.populate
      });
    }

    return docs;
  };

  Query.prototype.findOne = function* findOne(query) {
    var docs = yield this.find(query);

    return docs[0];
  };

  Query.prototype.remove = function* remove(query) {
    this.where(query);

    var collection = this.collection;
    var model = this.model;

    return yield collection.remove(this.query, this.options);
  };

  return Query;
})();

// Setting up functions that
// have the same implementation
var methods = ["lt", "lte", "gt", "gte", "in", "nin", "ne"];

methods.forEach(function (method) {
  Query.prototype[method] = function (key, value) {
    // if .where() was called with one argument
    // key was already set in this.lastKey
    if (this.lastKey) {
      value = key;
      key = this.lastKey;
      this.lastKey = null;
    }

    if (!value) {
      this.query["$" + method] = key;
    } else {
      this.query[key] = (function () {
        var _query$key = {};

        _query$key["$" + method] = value;
        return _query$key;
      })();
    }

    return this;
  };
});

// or, nor and and share the same imlpementation
["or", "nor", "and"].forEach(function (method) {
  Query.prototype[method] = function () {
    var args = isArray(arguments[0]) ? arguments[0] : Array.from(arguments);

    this.query["$" + method] = args;

    return this;
  };
});

module.exports = Query;
