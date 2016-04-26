'use strict';

/**
 * Dependencies
 */

const chance = require('chance')();


/**
 * Expose comment fixture
 */

module.exports = function commentFixture() {
	return {
		email: chance.email(),
		body: chance.paragraph()
	};
};
