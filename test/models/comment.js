'use strict';

/**
 * Dependencies
 */

const Model = require('../../').Model;


/**
 * Comment model
 */

const Comment = Model.extend({
	collection: 'comments'
});


/**
 * Expose `Comment`
 */

module.exports = Comment;
