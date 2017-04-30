'use strict';

const mongodb = require('mongodb');
const Database = require('./lib/database');
const Model = require('./lib/model');
const ActionTypes = require('./lib/action-types');

const x = module.exports = Database;
x.Database = Database;
x.Model = Model;
x.ActionTypes = ActionTypes;
x.Timestamp = mongodb.Timestamp;
x.ObjectId = mongodb.ObjectId;
x.MinKey = mongodb.MinKey;
x.MaxKey = mongodb.MaxKey;
x.DBRef = mongodb.DBRef;
x.Long = mongodb.Long;
