var pluralize = require('pluralize');

class Model {
  _collection () {
    if (!this.collection) {
      this.collection = this.constructor.prototype.collection = pluralize(this.constructor.name).toLowerCase();
    }
    
    return this.collection;
  }
  
  find () {
    this._collection();
  }
}

class User extends Model {
  
}

class Account extends Model {
  
}

var account = new Account();
console.log(account.collection);
account.find();
console.log(account.collection);
account = new Account();
console.log(account.collection);
