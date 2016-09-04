'use strict';

/**
 * Dependencies
 */

const Model = require('../../../').Model;


/**
 * Comment model
 */

class Comment extends Model {
	collection() {
		return 'comments';
	}
}


/**
 * Expose `Comment`
 */

module.exports = Comment;
