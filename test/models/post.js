/**
 * Dependencies
 */

var Model = require('../../').Model;


/**
 * Post model
 */

class Post extends Model {
  get collection () {
    return 'posts';
  }
  
  get defaults () {
    return {
      title: 'Default title'
    };
  }
}


/**
 * Expose `Post`
 */

module.exports = Post;
