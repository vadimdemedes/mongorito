'use strict';

const {
	Timestamp,
	ObjectId,
	MinKey,
	MaxKey,
	DBRef,
	Long
} = require('mongodb');

module.exports = require('./lib/database');
module.exports.Model = require('./lib/model');

module.exports.Timestamp = Timestamp;
module.exports.ObjectId = ObjectId;
module.exports.MinKey = MinKey;
module.exports.MaxKey = MaxKey;
module.exports.DBRef = DBRef;
module.exports.Long = Long;
