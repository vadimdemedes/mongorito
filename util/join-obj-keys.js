'use strict';

const isObject = require('is-plain-obj');

const flattenObject = require('./flatten-obj');

function joinKeys(obj, parentKey) {
	if (!obj) {
		obj = {};
	}

	if (!parentKey) {
		parentKey = '';
	}

	const newObj = {};

	Object.keys(obj).forEach(key => {
		let value = obj[key];

		if (isObject(value)) {
			value = joinKeys(value, parentKey + key + '.');
		}

		newObj[parentKey + key] = value;
	});

	return flattenObject(newObj);
}

module.exports = joinKeys;
