'use strict';

const chance = require('chance')();

function commentFixture() {
	return {
		email: chance.email(),
		body: chance.word()
	};
};

module.exports = commentFixture;
