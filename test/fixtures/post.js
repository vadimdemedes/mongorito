var chance = require('chance')();

var commentFixture = require('./comment');

module.exports = function postFixture (attrs) {
	var n = 2;
	var comments = [];
	
	while (n--) {
		comments.push(commentFixture());
	}
	
	var post = {
		title: chance.sentence(),
		body: chance.paragraph(),
		author: {
			name: chance.word()
		},
		comments: comments,
		views: 0
	};
	
	for (var key in attrs) {
		post[key] = attrs[key];
	}
	
	return post;
};