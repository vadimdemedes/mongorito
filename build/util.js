"use strict";

/**
 * Dependencies
 */

var ObjectID = require("monk/node_modules/mongoskin").ObjectID;


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
