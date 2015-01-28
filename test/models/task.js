/**
 * Dependencies
 */

var Model = require('../../').Model;


/**
 * Task model
 */

class Task extends Model {
  get collection () {
    return 'tasks';
  }
}


/**
 * Expose `Task`
 */

module.exports = Task;
