'use strict';

const isObject = require('is-plain-obj');
const dotProp = require('dot-prop');
const arrify = require('arrify');

const flatten = require('../util/join-obj-keys');

class Fields {
	constructor(fields) {
		this.fields = {};
		this.set(fields || {});
	}

	get(key) {
		return key ? dotProp.get(this.fields, key) : this.fields;
	}

	set(key, value) {
		if (isObject(key)) {
			const obj = flatten(key);

			Object.keys(obj).forEach(key => {
				this.set(key, obj[key]);
			});

			return;
		}

		dotProp.set(this.fields, key, value);
	}

	unset(key) {
		arrify(key).forEach(key => {
			dotProp.delete(this.fields, key);
		});
	}

	clear() {
		this.fields = {};
	}
}

module.exports = Fields;
