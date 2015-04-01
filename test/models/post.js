/**
 * Dependencies
 */

const Model = require('../../').Model;


/**
 * Post model
 */

class Post extends Model {
  defaults () {
    return {
      title: 'Default title'
    };
  }
}


/**
 * Expose `Post`
 */

module.exports = Post;
