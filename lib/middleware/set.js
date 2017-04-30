'use strict';

const dotProp = require('dot-prop');
const {SET} = require('../action-types');

module.exports = ({modelClass}) => next => action => {
	const {embeddedModels = []} = modelClass;

	if (action.type === SET && embeddedModels.length > 0) {
		const {fields} = action;

		embeddedModels.forEach(({key, model}) => {
			const value = dotProp.get(fields, key);
			let transformedValue;

			if (Array.isArray(value)) {
				transformedValue = value.map(item => {
					return item instanceof model ? item : new model(item); // eslint-disable-line new-cap
				});
			} else {
				transformedValue = value instanceof model ? value : new model(value); // eslint-disable-line new-cap
			}

			dotProp.set(fields, key, transformedValue);
		});
	}

	return next(action);
};
