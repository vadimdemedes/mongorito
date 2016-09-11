'use strict';

const toObjectId = require('./to-objectid');

function convertObjectIds(obj = {}, fields = ['_id']) {
	const newObj = Object.assign({}, obj);

	Object.keys(obj)
		.filter(key => fields.indexOf(key) >= 0)
		.forEach(key => {
			newObj[key] = toObjectId(newObj[key]);
		});

	return newObj;
}

module.exports = convertObjectIds;
