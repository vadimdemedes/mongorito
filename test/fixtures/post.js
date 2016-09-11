'use strict';

const chance = require('chance')();

const commentFixture = require('./comment');

function postFixture (attrs = {}) {
	let n = 2;
	const comments = [];

	while (n--) {
		comments.push(commentFixture());
	}

	const post = {
		title: chance.word(),
		body: chance.word(),
		author: {
			name: chance.word()
		},
		comments,
		views: 0
	};

	return Object.assign(post, attrs);
};

module.exports = postFixture;
