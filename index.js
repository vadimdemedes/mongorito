'use strict';

const mongodb = require('mongodb');

module.exports = require('./lib/database');
module.exports.Model = require('./lib/model');

module.exports.Timestamp = mongodb.Timestamp;
module.exports.ObjectId = mongodb.ObjectId;
module.exports.MinKey = mongodb.MinKey;
module.exports.MaxKey = mongodb.MaxKey;
module.exports.DBRef = mongodb.DBRef;
module.exports.Long = mongodb.Long;
