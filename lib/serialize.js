'use strict';

const mapObject = require('map-obj');

module.exports = obj => {
	return mapObject(obj, (key, value) => {
		if (value && typeof value.toBSON === 'function') {
			value = value.toBSON();
		}

		if (Array.isArray(value) && value[0] && typeof value[0].toBSON === 'function') {
			value = value.map(item => item.toBSON());
		}

		return [key, value];
	});
};
