'use strict';

const ActionTypes = require('./action-types');

exports.get = key => ({type: ActionTypes.GET, key});
exports.set = fields => ({type: ActionTypes.SET, fields});
exports.unset = keys => ({type: ActionTypes.UNSET, keys});
exports.refresh = () => ({type: ActionTypes.REFRESH});
exports.create = fields => ({type: ActionTypes.CREATE, fields});
exports.update = fields => ({type: ActionTypes.UPDATE, fields});
exports.save = fields => ({type: ActionTypes.SAVE, fields});
exports.remove = () => ({type: ActionTypes.REMOVE});
exports.increment = fields => ({type: ActionTypes.INCREMENT, fields});
exports.createIndex = args => ({type: ActionTypes.CREATE_INDEX, args});
exports.dropIndex = args => ({type: ActionTypes.DROP_INDEX, args});
exports.listIndexes = args => ({type: ActionTypes.LIST_INDEXES, args});
exports.query = (method, query) => ({type: ActionTypes.QUERY, method, query});
exports.call = (method, args) => ({type: ActionTypes.CALL, method, args});
