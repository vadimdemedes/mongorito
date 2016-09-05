'use strict';

const isObject = require('is-plain-obj');

function flattenObject(obj = {}) {
	const newObj = {};

	Object.keys(obj).forEach(key => {
		let value = obj[key];

		if (isObject(value)) {
			value = flattenObject(value);

			Object.keys(value).forEach(childKey => {
				newObj[childKey] = value[childKey];
			});
		} else {
			newObj[key] = value;
		}
	});

	return newObj;
}

module.exports = flattenObject;
