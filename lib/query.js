/**
* Dependencies
*/

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

const assign = Object.assign || require('object-assign');
const is = require('is_js');

const isObjectID = require('./util').isObjectID;

/**
* Query
*/

var Query = (function () {
  function Query(collection, model, key) {
    _classCallCheck(this, Query);

    this.collection = collection;
    this.model = model;
    this.query = {};
    this.options = {
      populate: {},
      sort: {},
      fields: {}
    };
    this.lastKey = key;
  }

  /**
   * Set "where" condition
   *
   * @param {String} key - key
   * @param {Mixed} value - value
   * @api public
   */

  Query.prototype.where = function where(key, value) {
    var _this = this;

    // if object was passed instead of key-value pair
    // iterate over that object and call .where(key, value)
    if (is.object(key)) {
      (function () {
        var conditions = key;
        var keys = Object.keys(conditions);

        keys.forEach(function (key) {
          _this.where(key, conditions[key]);
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

      // if value is a regular expression
      // use $regex modifier
      if (is.regexp(value)) {
        value = { $regex: value };
      }

      this.query[key] = value;
    }

    return this;
  };

  /**
   * Match documents using $elemMatch
   *
   * @param {String} key
   * @param {Object} value
   * @api public
   */

  Query.prototype.matches = function matches(key, value) {
    if (this.lastKey) {
      value = key;
      key = this.lastKey;
      this.lastKey = null;
    }

    this.query[key] = { $elemMatch: value };

    return this;
  };

  Query.prototype.match = function match() {
    return this.matches.apply(this, arguments);
  };

  /**
   * Include fields in a result
   *
   * @param {String} key
   * @param {Mixed} value
   * @api public
   */

  Query.prototype.include = function include(key, value) {
    var _this2 = this;

    if (is.array(key)) {
      var fields = key;

      fields.forEach(function (key) {
        _this2.include(key);
      });
    }

    if (is.object(key)) {
      (function () {
        var fields = key;
        var keys = Object.keys(fields);

        keys.forEach(function (key) {
          _this2.include(key, fields[key]);
        });
      })();
    }

    if (is.string(key)) {
      this.options.fields[key] = value == undefined ? 1 : value;
    }

    return this;
  };

  /**
   * Exclude fields from result
   *
   * @param {String} key
   * @param {String} value
   * @api public
   */

  Query.prototype.exclude = function exclude(key, value) {
    var _this3 = this;

    if (is.array(key)) {
      var fields = key;

      fields.forEach(function (key) {
        _this3.exclude(key);
      });
    }

    if (is.object(key)) {
      (function () {
        var fields = key;
        var keys = Object.keys(fields);

        keys.forEach(function (key) {
          _this3.exclude(key, fields[key]);
        });
      })();
    }

    if (is.string(key)) {
      this.options.fields[key] = value == undefined ? 0 : value;
    }

    return this;
  };

  /**
   * Search using text index
   *
   * @param {String} text
   * @api public
   */

  Query.prototype.search = function search(text) {
    this.where({
      '$text': {
        '$search': text
      }
    });

    return this;
  };

  /**
   * Set query limit
   *
   * @param {Number} limit - limit number
   * @api public
   */

  Query.prototype.limit = function limit(_limit) {
    this.options.limit = _limit;

    return this;
  };

  /**
   * Set query skip
   *
   * @param {Number} skip - skip number
   * @api public
   */

  Query.prototype.skip = function skip(_skip) {
    this.options.skip = _skip;

    return this;
  };

  /**
   * Sort query results
   *
   * @param {Object} sort - sort params
   * @see http://docs.mongodb.org/manual/reference/method/cursor.sort/
   * @see https://github.com/Automattic/monk
   * @api public
   */

  Query.prototype.sort = function sort(key, value) {
    if (is.object(key)) {
      assign(this.options.sort, key);
    }

    if (is.string(key) && value) {
      this.options.sort[key] = value;
    }

    return this;
  };

  /**
   * Same as .where(), only less flexible
   *
   * @param {String} key - key
   * @param {Mixed} value - value
   * @api public
   */

  Query.prototype.equals = function equals(value) {
    var key = this.lastKey;
    this.lastKey = null;

    this.query[key] = value;

    return this;
  };

  /**
   * Set property that must or mustn't exist in resulting docs
   *
   * @param {String} key - key
   * @param {Boolean} exists - exists or not
   * @api public
   */

  Query.prototype.exists = function exists(key, _exists) {
    if (this.lastKey) {
      _exists = key;
      key = this.lastKey;
      this.lastKey = null;
    }

    this.query[key] = { $exists: _exists || true };

    return this;
  };

  /**
   * Query population
   *
   * @param {String} key - key
   * @param {Model} model - model to populate with
   * @see http://mongorito.com/guides/query-population/
   * @api public
   */

  Query.prototype.populate = function populate(key, model) {
    this.options.populate[key] = model;

    return this;
  };

  /**
   * Count documents
   *
   * @param {Object} query - find conditions, same as this.where()
   * @api public
   */

  Query.prototype.count = function* count(query) {
    this.where(query);

    return yield this.collection.count(this.query);
  };

  /**
   * Find documents
   *
   * @param {Object} query - find conditions, same as this.where()
   * @api public
   */

  Query.prototype.find = function* find(query, options) {
    this.where(query);

    var model = this.model;

    // query options
    options = assign({}, this.options, options);

    // fields to populate
    var populate = Object.keys(options.populate);

    // find
    var docs = yield this.collection.find(this.query, options);

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
        if (is.array(value)) {
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

  /**
   * Find one document
   *
   * @param {Object} query - find conditions, same as this.where()
   * @api public
   */

  Query.prototype.findOne = function* findOne(query) {
    var docs = yield this.find(query);

    return docs[0];
  };

  /**
   * Remove documents
   *
   * @param {Object} query - remove conditions, same as this.where()
   * @api public
   */

  Query.prototype.remove = function* remove(query) {
    this.where(query);

    return yield this.collection.remove(this.query, this.options);
  };

  return Query;
})()

// Setting up functions that
// have the same implementation
;

const methods = ['lt', 'lte', 'gt', 'gte', 'in', 'nin', 'ne'];

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
      this.query['$' + method] = key;
    } else {
      var _query$key;

      this.query[key] = (_query$key = {}, _query$key['$' + method] = value, _query$key);
    }

    return this;
  };
});

// or, nor and and share the same imlpementation
['or', 'nor', 'and'].forEach(function (method) {
  Query.prototype[method] = function () {
    var args = is.array(arguments[0]) ? arguments[0] : Array.from(arguments);

    this.query['$' + method] = args;

    return this;
  };
});

/**
 * Expose Query
 */

module.exports = Query;
