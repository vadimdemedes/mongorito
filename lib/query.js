"use strict";

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/**
* Module dependencies
*/

var is = require("is_js");

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

  _prototypeProperties(Query, null, {
    where: {
      value: function where(key, value) {
        var _this = this;
        // if object was passed instead of key-value pair
        // iterate over that object and call .where(key, value)
        if (is.object(key)) {
          (function () {
            var conditions = key;
            var keys = Object.keys(conditions);

            keys.forEach(function (key) {
              return _this.where(key, conditions[key]);
            });
          })();
        }

        if (is.string(key)) {
          // if only one argument was supplied
          // save the key in this.lastKey
          // for future methods, like .equals()
          if (is.undefined(value)) {
            this.lastKey = key;
            return this;
          }

          // 1. if regular expression
          // 2. if object and not ObjectID
          if (is.regexp(value)) {
            value = { $regex: value };
          } else if (is.object(value) && !isObjectID(value)) {
            value = { $elemMatch: value };
          }

          this.query[key] = value;
        }

        return this;
      },
      writable: true,
      configurable: true
    },
    limit: {
      value: function limit(limit) {
        this.options.limit = limit;

        return this;
      },
      writable: true,
      configurable: true
    },
    skip: {
      value: function skip(skip) {
        this.options.skip = skip;

        return this;
      },
      writable: true,
      configurable: true
    },
    sort: {
      value: function sort(sort) {
        this.options.sort = sort;

        return this;
      },
      writable: true,
      configurable: true
    },
    equals: {
      value: function equals(value) {
        var key = this.lastKey;
        this.lastKey = null;

        this.query[key] = value;

        return this;
      },
      writable: true,
      configurable: true
    },
    exists: {
      value: function exists(key, exists) {
        if (this.lastKey) {
          exists = key;
          key = this.lastKey;
          this.lastKey = null;
        }

        this.query[key] = { $exists: exists || true };

        return this;
      },
      writable: true,
      configurable: true
    },
    populate: {
      value: function populate(key, model) {
        this.options.populate[key] = model;

        return this;
      },
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
              _this.where(query);

              collection = _this.collection;
              model = _this.model;
              count = collection.count(_this.query);
              context$2$0.next = 6;
              return count;
            case 6:
              return context$2$0.abrupt("return", context$2$0.sent);
            case 7:
            case "end":
              return context$2$0.stop();
          }
        }, count, this);
      }),
      writable: true,
      configurable: true
    },
    find: {
      value: regeneratorRuntime.mark(function find(query) {
        var _this = this;
        var collection, model, options, populate, docs, i, doc, j, key, childModel, value;
        return regeneratorRuntime.wrap(function find$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              _this.where(query);

              collection = _this.collection;
              model = _this.model;
              options = _this.options;
              populate = Object.keys(options.populate);
              context$2$0.next = 7;
              return collection.find(_this.query, options);
            case 7:
              docs = context$2$0.sent;
              i = 0;
              doc = undefined;
            case 10:
              if (!(doc = docs[i++])) {
                context$2$0.next = 25;
                break;
              }
              j = 0;
              key = undefined;
            case 13:
              if (!(key = populate[j++])) {
                context$2$0.next = 22;
                break;
              }
              childModel = options.populate[key];
              value = doc[key];


              // if value is an array of IDs, loop through it
              if (is.array(value)) {
                // convert each _id
                // to findById op
                value = value.map(childModel.findById, childModel);
              } else {
                value = childModel.findById(value);
              }

              context$2$0.next = 19;
              return value;
            case 19:
              doc[key] = context$2$0.sent;
              context$2$0.next = 13;
              break;
            case 22:


              // index - 1, because index here is already an index of the next document
              docs[i - 1] = new model(doc, {
                populate: options.populate
              });
              context$2$0.next = 10;
              break;
            case 25:
              return context$2$0.abrupt("return", docs);
            case 26:
            case "end":
              return context$2$0.stop();
          }
        }, find, this);
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
    remove: {
      value: regeneratorRuntime.mark(function remove(query) {
        var _this = this;
        var collection, model;
        return regeneratorRuntime.wrap(function remove$(context$2$0) {
          while (1) switch (context$2$0.prev = context$2$0.next) {
            case 0:
              _this.where(query);

              collection = _this.collection;
              model = _this.model;
              context$2$0.next = 5;
              return collection.remove(_this.query, _this.options);
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
    }
  });

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
      this.query[key] = _defineProperty({}, "$" + method, value);
    }

    return this;
  };
});

// or, nor and and share the same imlpementation
["or", "nor", "and"].forEach(function (method) {
  Query.prototype[method] = function () {
    var args = is.array(arguments[0]) ? arguments[0] : Array.from(arguments);

    this.query["$" + method] = args;

    return this;
  };
});

module.exports = Query;


// fields to populate
// options.populate is a key-model pair object
// model to use when populating the field
// replace previous ID with actual documents
