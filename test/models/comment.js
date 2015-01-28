/**
 * Dependencies
 */

var Model = require('../../').Model;


/**
 * Comment model
 */

class Comment extends Model {
  get collection () {
    return 'comments';
  }
}


/**
 * Expose `Comment`
 */

module.exports = Comment;
