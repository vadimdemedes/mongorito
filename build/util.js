"use strict";

/**
 * Dependencies
 */

var ObjectID = require("monk/node_modules/mongoskin").ObjectID;


/**
 * Expose utilities
 */

exports.isFunction = isFunction;
exports.isObjectID = isObjectID;
exports.isRegExp = isRegExp;
exports.isObject = isObject;
exports.isString = isString;
exports.isArray = isArray;


/**
 * Utilities
 */

function isFunction(value) {
  return !!(value && "function" === typeof value);
}

function isObjectID(value) {
  return !!(value && ObjectID === value.constructor);
}

function isRegExp(value) {
  return !!(value && RegExp === value.constructor);
}

function isObject(value) {
  return !!(value && "object" === typeof value);
}

function isString(value) {
  return !!(value && "string" === typeof value);
}

function isArray(value) {
  return !!(value && "object" === typeof value && "number" === typeof value.length && Array === value.constructor);
}
