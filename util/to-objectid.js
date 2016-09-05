'use strict';

const { ObjectId } = require('mongodb');

function toObjectId(id) {
	return id && id.length === 24 ? new ObjectId(id) : id;
}

module.exports = toObjectId;
