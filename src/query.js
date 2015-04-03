/**
* Dependencies
*/

const is = require('is_js');

const isObjectID = require('./util').isObjectID;


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


  /**
   * Set "where" condition
   *
   * @param {String} key - key
   * @param {Mixed} value - value
   * @api public
   */
  
  where (key, value) {
    // if object was passed instead of key-value pair
    // iterate over that object and call .where(key, value)
    if (is.object(key)) {
      let conditions = key;
      let keys = Object.keys(conditions);

      keys.forEach(key => {
        this.where(key, conditions[key]);
      });
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
  }


  /**
   * Set query limit
   *
   * @param {Number} limit - limit number
   * @api public
   */
  
  limit (limit) {
    this.options.limit = limit;

    return this;
  }


  /**
   * Set query skip
   *
   * @param {Number} skip - skip number
   * @api public
   */
  
  skip (skip) {
    this.options.skip = skip;

    return this;
  }


  /**
   * Sort query results
   *
   * @param {Object} sort - sort params
   * @see http://docs.mongodb.org/manual/reference/method/cursor.sort/
   * @see https://github.com/Automattic/monk
   * @api public
   */
  
  sort (sort) {
    this.options.sort = sort;

    return this;
  }


  /**
   * Same as .where(), only less flexible
   *
   * @param {String} key - key
   * @param {Mixed} value - value
   * @api public
   */
  
  equals (value) {
    let key = this.lastKey;
    this.lastKey = null;

    this.query[key] = value;

    return this;
  }


  /**
   * Set property that must or mustn't exist in resulting docs
   *
   * @param {String} key - key
   * @param {Boolean} exists - exists or not
   * @api public
   */
  
  exists (key, exists) {
    if (this.lastKey) {
      exists = key;
      key = this.lastKey;
      this.lastKey = null;
    }

    this.query[key] = { $exists: exists || true };

    return this;
  }


  /**
   * Query population
   *
   * @param {String} key - key
   * @param {Model} model - model to populate with
   * @see http://mongorito.com/guides/query-population/
   * @api public
   */
  
  populate (key, model) {
    this.options.populate[key] = model;

    return this;
  }


  /**
   * Count documents
   *
   * @param {Object} query - find conditions, same as this.where()
   * @api public
   */
  
  * count (query) {
    this.where(query);

    return yield this.collection.count(this.query);
  }
  
  /**
   * Find documents
   *
   * @param {Object} query - find conditions, same as this.where()
   * @api public
   */

  * find (query) {
    this.where(query);
    
    let model = this.model;
    let options = this.options;

    // fields to populate
    let populate = Object.keys(options.populate);

    let docs = yield this.collection.find(this.query, options);

    let i = 0;
    let doc;

    while (doc = docs[i++]) {
      // options.populate is a key-model pair object
      let j = 0;
      let key;

      while (key = populate[j++]) {
        // model to use when populating the field
        let childModel = options.populate[key];

        let value = doc[key];

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
  }

  
  /**
   * Find one document
   *
   * @param {Object} query - find conditions, same as this.where()
   * @api public
   */
  
  * findOne (query) {
    let docs = yield this.find(query);

    return docs[0];
  }
  
  
  /**
   * Remove documents
   *
   * @param {Object} query - remove conditions, same as this.where()
   * @api public
   */

  * remove (query) {
    this.where(query);

    return yield this.collection.remove(this.query, this.options);
  }
}

// Setting up functions that
// have the same implementation
const methods = [
  'lt',
  'lte',
  'gt',
  'gte',
  'in',
  'nin',
  'ne'
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

    if (!value) {
      this.query['$' + method] = key;
    } else {
      this.query[key] = {
        ['$' + method]: value
      };
    }

    return this;
  };
});

// or, nor and and share the same imlpementation
['or', 'nor', 'and'].forEach(method => {
  Query.prototype[method] = function () {
    let args = is.array(arguments[0]) ? arguments[0] : Array.from(arguments);
    
    this.query['$' + method] = args;
    
    return this;
  };
});


/**
 * Expose Query
 */

module.exports = Query;
