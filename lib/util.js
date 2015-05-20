/**
 * Dependencies
 */

'use strict';

const ObjectID = require('monk/node_modules/mongoskin').ObjectID;

/**
 * Expose utilities
 */

exports.isObjectID = isObjectID;

/**
 * Utilities
 */

function isObjectID(value) {
  return !!(value && ObjectID === value.constructor);
}
