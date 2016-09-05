'use strict';

/**
 * Dependencies
 */

const Model = require('../../../').Model;


/**
 * Post model
 */

class Post extends Model {

}

Post.defaultFields = {
	title: 'Default title'
};


/**
 * Expose `Post`
 */

module.exports = Post;
