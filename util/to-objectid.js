'use strict';

/**
 * Dependencies
 */

const ObjectId = require('mongodb').ObjectId;


/**
 * Expose `to-objectid`
 */

module.exports = toObjectId;


/**
 * Ensure that ids are always instances of ObjectId
 */

function toObjectId (id) {
	if (id instanceof ObjectId) {
		return id;
	}

	return new ObjectId(id);
}
