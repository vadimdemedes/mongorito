'use strict';

const prefix = '@@mongorito';

exports.GET = `${prefix}/GET`;
exports.SET = `${prefix}/SET`;
exports.UNSET = `${prefix}/UNSET`;
exports.REFRESH = `${prefix}/REFRESH`;
exports.REFRESHED = `${prefix}/REFRESHED`;
exports.SAVE = `${prefix}/SAVE`;
exports.CREATE = `${prefix}/CREATE`;
exports.CREATED = `${prefix}/CREATED`;
exports.UPDATE = `${prefix}/UPDATE`;
exports.UPDATED = `${prefix}/UPDATED`;
exports.REMOVE = `${prefix}/REMOVE`;
exports.REMOVED = `${prefix}/REMOVED`;
exports.INCREMENT = `${prefix}/INCREMENT`;
exports.CREATE_INDEX = `${prefix}/CREATE_INDEX`;
exports.DROP_INDEX = `${prefix}/DROP_INDEX`;
exports.LIST_INDEXES = `${prefix}/LIST_INDEXES`;
exports.QUERY = `${prefix}/QUERY`;
exports.CALL = `${prefix}/CALL`;
