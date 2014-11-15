var chance = require('chance')();

module.exports = function commentFixture() {
	return {
		body: chance.paragraph()
	};
};