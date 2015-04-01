/**
 * Dependencies
 */

const chance = require('chance')();


/**
 * Expose comment fixture
 */

module.exports = function commentFixture() {
	return {
		body: chance.paragraph()
	};
};
