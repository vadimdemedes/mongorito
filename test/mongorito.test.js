/**
* Dependencies
*/

var should = require('chai').should();
require('mocha-generators')();

var chance = require('chance')();

var Mongorito = require('../');
var Model = Mongorito.Model;

var Account = require('./models/account');
var Comment = require('./models/comment');
var Post = require('./models/post');
var Task = require('./models/task');

/**
* Fixtures
*/

var commentFixture = require('./fixtures/comment');
var postFixture = require('./fixtures/post');


/*
* Tests
*/

describe ('Mongorito', function () {
  it ('should expose mongodb module properties', function () {
    let mongodb = require('monk/node_modules/mongoskin/node_modules/mongodb');

    Object.keys(mongodb).forEach(key => {
      if ('connect' !== key && 'version' !== key) Mongorito[key].should.equal(mongodb[key]);
    });
  });

  before (function () {
    Mongorito.connect('mongo://localhost/mongorito_test');
  });

  beforeEach (function *() {
    yield Account.remove();
    yield Comment.remove();
    yield Post.remove();
    yield Task.remove();
  });

  describe ('Model', function () {
    it ('should initialize model and manage attributes', function () {
      let data, post, attrs;

      data = postFixture();
      post = new Post(data);
      attrs = post.get();

      Object.keys(attrs).forEach(key => post.get(key).should.equal(data[key]));

      data = postFixture();
      post.set(data);
      attrs = post.get();

      Object.keys(attrs).forEach(key => post.get(key).should.equal(data[key]));
    });

    it ('should correctly convert model to JSON', function () {
      let data = postFixture();
      let post = new Post(data);

      let json = JSON.stringify(post);
      let parsed = JSON.parse(json);

      parsed.title.should.equal(data.title);
      parsed.body.should.equal(data.body);
    });

    it ('should remember previous attributes', function () {
      let post = new Post({ title: 'Sad title' });
      post.get('title').should.equal('Sad title');
      post.set('title', 'Happy title');
      post.previous.title.should.equal('Sad title');
      post.get('title').should.equal('Happy title');
      post.changed.title.should.be.true;
    });

    it ('should not remember anything if nothing changed', function () {
      let post = new Post({ title: 'Sad title' });
      post.get('title').should.equal('Sad title');
      post.set('title', 'Sad title');
      should.not.exist(post.previous.title);
      post.get('title').should.equal('Sad title');
      should.not.exist(post.changed.title);
    });

    it ('should setup an index', function *() {
      yield Post.index('title');

      let indexes = yield Post.indexes();
      indexes.should.have.property('title_1');
    });

    it ('should setup a unique index', function *() {
      yield Task.index('name', { unique: true });

      let indexes = yield Task.indexes();
      indexes.should.have.property('name_1');

      let firstTask = new Task({ name: 'first' });
      let secondTask = new Task({ name: 'first' });

      yield firstTask.save();

      let err;

      try {
        yield secondTask.save();
      } catch (e) {
        err = e;
        e.name.should.equal('MongoError');
      }

      (typeof err).should.equal('object');
    });

    it ('should create new a document', function *() {
      let timestamp = Math.round(new Date().getTime() / 1000);

      let data = postFixture();
      let post = new Post(data);
      yield post.save();

      let posts = yield Post.all();
      let createdPost = posts[0];

      posts.length.should.equal(1);
      createdPost.get('_id').toString().should.equal(post.get('_id').toString());

      let createdAt = Math.round(createdPost.get('created_at').getTime() / 1000);
      let updatedAt = Math.round(createdPost.get('updated_at').getTime() / 1000);

      createdAt.should.equal(timestamp);
      updatedAt.should.equal(timestamp);
    });

    it ('should create a new document with default values', function *() {
      let data = postFixture();
      delete data.title;

      let post = new Post(data);
      yield post.save();

      post.get('title').should.equal('Default title');
    });

    it ('should update a document', function *() {
      let createdAt = Math.round(new Date().getTime() / 1000);
      let data = postFixture();
      let post = new Post(data);
      yield post.save();

      let posts;

      posts = yield Post.all();
      posts.length.should.equal(1);

      let createdPost = yield Post.findOne();
      createdPost.get('_id').toString().should.equal(post.get('_id').toString());
      createdPost.get('title').should.equal(post.get('title'));

      let updatedAt = Math.round(new Date().getTime() / 1000);

      let title = chance.sentence();
      post.set('title', title);
      yield post.save();

      posts = yield Post.all();
      posts.length.should.equal(1);

      let updatedPost = yield Post.findOne();
      updatedPost.get('_id').toString().should.equal(post.get('_id').toString());
      updatedPost.get('title').should.equal(post.get('title'));

      Math.round(updatedPost.get('created_at').getTime() / 1000).should.equal(createdAt);
      Math.round(updatedPost.get('updated_at').getTime() / 1000).should.equal(updatedAt);
    });

    it ('should remove a document', function *() {
      let post = new Post();
      yield post.save();

      let posts;

      posts = yield Post.all();
      posts.length.should.equal(1);

      post = posts[0];
      yield post.remove();

      posts = yield Post.all();
      posts.length.should.equal(0);
    });

    it ('should remove many documents', function *() {
      let n = 10;

      while (n--) {
        let data = postFixture();
        let post = new Post(data);
        yield post.save();
      }

      let posts;

      posts = yield Post.all();
      posts.length.should.equal(10);

      yield Post.remove();

      posts = yield Post.all();
      posts.length.should.equal(0);
    });

    it ('should atomically increment a property', function *() {
      let data = postFixture();
      let post = new Post(data);

      let errorThrown = false;

      try {
        yield post.inc({ views: 1 });
      } catch (err) {
        errorThrown = true;
      }

      errorThrown.should.equal(true);

      yield post.save();
      post.get('views').should.equal(0);

      yield post.inc({ views: 1 });
      post.get('views').should.equal(1);
    });

    describe ('Queries', function () {
      it ('should find all documents', function *() {
        let n = 10;

        while (n--) {
          let data = postFixture();
          let post = new Post(data);
          yield post.save();
        }

        let posts = yield Post.all();

        let createdPosts = yield Post.find();
        createdPosts.length.should.equal(10);

        createdPosts.forEach((post, index) => {
          post.get('_id').toString().should.equal(posts[index].get('_id').toString());
        });
      });

      it ('should count all documents', function *() {
        let n = 10;
        let createdPosts = [];

        while (n--) {
          let data = postFixture();
          let post = new Post(data);
          yield post.save();

          createdPosts.push(post);
        }

        let posts = yield Post.count();
        posts.should.equal(10);
      });

      it ('should find one document', function *() {
        let data = postFixture();
        let post = new Post(data);
        yield post.save();

        let posts = yield Post.all();
        posts.length.should.equal(1);

        let createdPost = yield Post.findOne();
        createdPost.get('_id').toString().should.equal(post.get('_id').toString());

        createdPost = yield Post.findOne({ title: post.get('title') });
        createdPost.get('_id').toString().should.equal(post.get('_id').toString());
      });

      it ('should find a document with .where()', function *() {
        let data = postFixture();
        let post = new Post(data);
        yield post.save();

        let posts = yield Post.where('title', data.title).find();
        posts.length.should.equal(1);

        let createdPost = posts[0];
        createdPost.get('_id').toString().should.equal(post.get('_id').toString());
      });

      it ('should find a document with .where() matching sub-properties', function *() {
        let data = postFixture();
        let post = new Post(data);
        yield post.save();

        let posts = yield Post.where('author.name', data.author.name).find();
        posts.length.should.equal(1);

        let createdPost = posts[0];
        createdPost.get('_id').toString().should.equal(post.get('_id').toString());
      });

      it ('should find a document with .where() matching sub-documents using elemMatch', function *() {
        let data = postFixture();
        let post = new Post(data);
        yield post.save();

        let posts = yield Post.where('comments', { body: data.comments[0].body }).find();
        posts.length.should.equal(1);

        let createdPost = posts[0];
        createdPost.get('_id').toString().should.equal(post.get('_id').toString());
      });

      it ('should find a document with .where() matching with regex', function *() {
        let data = postFixture({ title: 'Something' });
        let post = new Post(data);
        yield post.save();

        let posts = yield Post.where('title', /something/i).find();
        posts.length.should.equal(1);

        let createdPost = posts[0];
        createdPost.get('_id').toString().should.equal(post.get('_id').toString());
      });

      it ('should find documents with .limit()', function *() {
        let n = 10;

        while (n--) {
          let data = postFixture();
          let post = new Post(data);
          yield post.save();
        }

        let posts = yield Post.all();

        let createdPosts = yield Post.limit(5).find();
        createdPosts.length.should.equal(5);
        createdPosts.forEach((post, index) => {
          post.get('_id').toString().should.equal(posts[index].get('_id').toString());
        });
      });

      it ('should find documents with .limit() and .skip()', function *() {
        let n = 10;

        while (n--) {
          let data = postFixture();
          let post = new Post(data);
          yield post.save();
        }

        let posts = yield Post.all();

        let createdPosts = yield Post.limit(5).skip(5).find();
        createdPosts.length.should.equal(5);
        createdPosts.forEach((post, index) => {
          post.get('_id').toString().should.equal(posts[5 + index].get('_id').toString());
        });
      });

      it ('should find documents with .exists()', function *() {
        let n = 10;

        while (n--) {
          let data = postFixture();
          if (n < 5) {
            delete data.body;
          }

          let post = new Post(data);
          yield post.save();
        }

        let posts;

        posts = yield Post.exists('body').find();
        posts.length.should.equal(5);

        posts = yield Post.exists('body', false).find();
        posts.length.should.equal(5);

        posts = yield Post.where('body').exists().find();
        posts.length.should.equal(5);

        posts = yield Post.where('body').exists(false).find();
        posts.length.should.equal(5);
      });

      it ('should find documents with .lt(), .lte(), .gt(), .gte()', function *() {
        let n = 10;

        while (n--) {
          let data = postFixture({ index: n });
          let post = new Post(data);
          yield post.save();
        }

        let posts;

        posts = yield Post.where('index').lt(5).find();
        posts.length.should.equal(5);

        posts = yield Post.where('index').lte(5).find();
        posts.length.should.equal(6);

        posts = yield Post.where('index').gt(7).find();
        posts.length.should.equal(2);

        posts = yield Post.where('index').gte(7).find();
        posts.length.should.equal(3);
      });

      it ('should find documents with .or()', function *() {
        yield new Post(postFixture({
          isPublic: true,
          author: {
            name: 'user1'
          }
        })).save();

        yield new Post(postFixture({
          isPublic: false,
          author: {
            name: 'user2'
          }
        })).save();

        yield new Post(postFixture({
          isPublic: false,
          author: {
            name: 'user3'
          }
        })).save();

        let posts = yield Post.or({ isPublic: true }, { ['author.name']: 'user2' }).find();

        posts.length.should.equal(2);
        posts[0].get('author').name.should.equal('user1');
        posts[1].get('author').name.should.equal('user2');
      });

      it ('should find documents with .and()', function *() {
        yield new Post(postFixture({
          isPublic: true,
          author: {
            name: 'user1'
          }
        })).save();

        yield new Post(postFixture({
          isPublic: false,
          author: {
            name: 'user2'
          },
          title: 'second'
        })).save();

        yield new Post(postFixture({
          isPublic: false,
          author: {
            name: 'user2'
          },
          title: 'third'
        })).save();

        let posts = yield Post.and({ isPublic: false }, { ['author.name']: 'user2' }).find();

        posts.length.should.equal(2);
        posts[0].get('title').should.equal('second');
        posts[1].get('title').should.equal('third');
      });

      it ('should find documents with .in()', function *() {
        let n = 10;

        while (n--) {
          let data = postFixture({ index: n });
          let post = new Post(data);
          yield post.save();
        }

        let posts = yield Post.where('index').in([4, 5]).find();
        posts.length.should.equal(2);
      });

      it ('should sort documents', function *() {
        let n = 10;

        while (n--) {
          let data = postFixture({ index: n });
          let post = new Post(data);
          yield post.save();
        }

        let posts = yield Post.sort({ _id: -1 }).find();
        posts.length.should.equal(10);

        n = 10;

        while (n--) {
          let post = posts[n];
          post.get('index').should.equal(n);
        }

        posts = yield Post.sort({ _id: 1 }).find();
        posts.length.should.equal(10);

        n = 10;

        while (n--) {
          let post = posts[n];
          post.get('index').should.equal(9 - n);
        }
      });

      it ('should populate the response', function *() {
        let n = 3;
        let comments = [];

        while (n--) {
          let data = commentFixture();
          let comment = new Comment(data);
          yield comment.save();

          comments.push(comment);
        }

        let data = postFixture({
          comments: comments.map(comment => comment.get('_id'))
        });
        let post = new Post(data);
        yield post.save();

        let createdPost = yield Post.populate('comments', Comment).findOne();
        createdPost.get('comments').forEach((comment, index) => {
          comment.get('_id').toString().should.equal(comments[index].get('_id').toString());
        });

        // now confirm that populated documents
        // don't get saved to database
        yield createdPost.save();

        createdPost = yield Post.findOne();
        createdPost.get('comments').forEach((id, index) => {
          id.toString().should.equal(comments[index].get('_id').toString());
        });
      });
    });

    describe ('Hooks', function () {
      it ('should execute all hooks', function *() {
        let hooks = [];

        class Post extends Model {
          get collection () {
            return 'posts';
          }

          configure () {
            this.before('save', 'beforeSave');
            this.after('save', 'afterSave');
            this.around('save', 'aroundSave');

            this.before('create', 'beforeCreate');
            this.after('create', 'afterCreate');
            this.around('create', 'aroundCreate');

            this.before('update', 'beforeUpdate');
            this.after('update', 'afterUpdate');
            this.around('update', 'aroundUpdate');

            this.before('remove', 'beforeRemove');
            this.after('remove', 'afterRemove');
            this.around('remove', 'aroundRemove');
          }

          // Save hooks
          * beforeSave (next) {
            hooks.push('before:save');

            yield next;
          }

          * afterSave (next) {
            hooks.push('after:save');

            yield next;
          }

          * aroundSave (next) {
            hooks.push('around:save');

            yield next;
          }

          // Create hooks
          * beforeCreate (next) {
            hooks.push('before:create');

            yield next;
          }

          * afterCreate (next) {
            hooks.push('after:create');

            yield next;
          }

          * aroundCreate (next) {
            hooks.push('around:create');

            yield next;
          }

          // Update hooks
          * beforeUpdate (next) {
            hooks.push('before:update');

            yield next;
          }

          * afterUpdate (next) {
            hooks.push('after:update');

            yield next;
          }

          * aroundUpdate (next) {
            hooks.push('around:update');

            yield next;
          }

          // Remove hooks
          * beforeRemove (next) {
            hooks.push('before:remove');

            yield next;
          }

          * afterRemove (next) {
            hooks.push('after:remove');

            yield next;
          }

          * aroundRemove (next) {
            hooks.push('around:remove');

            yield next;
          }
        }

        let data = postFixture();
        let post = new Post(data);
        yield post.save();

        hooks.length.should.equal(8);
        hooks[0].should.equal('before:save');
        hooks[1].should.equal('around:save');
        hooks[2].should.equal('before:create');
        hooks[3].should.equal('around:create');
        hooks[4].should.equal('around:create');
        hooks[5].should.equal('after:create');
        hooks[6].should.equal('around:save');
        hooks[7].should.equal('after:save');

        hooks = [];

        post.set('title', 'New title');
        yield post.save();

        hooks.length.should.equal(8);
        hooks[0].should.equal('before:save');
        hooks[1].should.equal('around:save');
        hooks[2].should.equal('before:update');
        hooks[3].should.equal('around:update');
        hooks[4].should.equal('around:update');
        hooks[5].should.equal('after:update');
        hooks[6].should.equal('around:save');
        hooks[7].should.equal('after:save');

        hooks = [];

        yield post.remove();

        hooks.length.should.equal(4);
        hooks[0].should.equal('before:remove');
        hooks[1].should.equal('around:remove');
        hooks[2].should.equal('around:remove');
        hooks[3].should.equal('after:remove');
      });

      it ('should abort if a hook throws an error', function *() {
        let hooks = [];

        class Post extends Model {
          get collection () {
            return 'posts';
          }

          configure () {
            this.before('save', 'firstBeforeSave');
            this.before('save', 'secondBeforeSave');
          }

          * firstBeforeSave (next) {
            hooks.push('firstBeforeSave');

            throw new Error('firstBeforeSave failed.');

            yield next;
          }

          * secondBeforeSave (next) {
            hooks.push('secondBeforeSave');

            yield next;
          }
        }

        let posts;

        posts = yield Post.all();
        posts.length.should.equal(0);

        let data = postFixture();
        let post = new Post(data);
        try {
          yield post.save();
        } catch (e) {
          hooks.length.should.equal(1);
          hooks[0].should.equal('firstBeforeSave');
        } finally {
          posts = yield Post.all();
          posts.length.should.equal(0);
        }
      });

      it ('should allow registration of hooks through an object, or with an array of methods', function *() {
        let hooks = [];

        class Post extends Model {
          get collection () {
            return 'posts';
          }

          configure () {
            this.hooks({
              'before:save': 'beforeSave',
              'before:create': ['firstBeforeCreate', 'secondBeforeCreate'],
              'after:save': 'afterSave',
              'after:create': 'firstAfterCreate',
              'around:create': ['firstAroundCreate', 'secondAroundCreate']
            });

            this.after('create', ['secondAfterCreate', 'thirdAfterCreate']);
          }

          * beforeSave (next){
            hooks.push('beforeSave');

            yield next;
          }

          * firstBeforeCreate (next){
            hooks.push('firstBeforeCreate');

            yield next;
          }

          * secondBeforeCreate (next){
            hooks.push('secondBeforeCreate');

            yield next;
          }

          * afterSave (next){
            hooks.push('afterSave');

            yield next;
          }

          * firstAfterCreate (next){
            hooks.push('firstAfterCreate');

            yield next;
          }

          * firstAroundCreate (next){
            hooks.push('firstAroundCreate');

            yield next;
          }

          * secondAroundCreate (next){
            hooks.push('secondAroundCreate');

            yield next;
          }

          * secondAfterCreate (next){
            hooks.push('secondAfterCreate');

            yield next;
          }

          * thirdAfterCreate (next){
            hooks.push('thirdAfterCreate');

            yield next;
          }
        }

        let data = postFixture();
        let post = new Post(data);
        yield post.save();

        hooks.length.should.equal(11);
        hooks[0].should.equal('beforeSave');
        hooks[1].should.equal('firstBeforeCreate');
        hooks[2].should.equal('secondBeforeCreate');
        hooks[3].should.equal('firstAroundCreate');
        hooks[4].should.equal('secondAroundCreate');
        hooks[5].should.equal('secondAroundCreate');
        hooks[6].should.equal('firstAroundCreate');
        hooks[7].should.equal('firstAfterCreate');
        hooks[8].should.equal('secondAfterCreate');
        hooks[9].should.equal('thirdAfterCreate');
        hooks[10].should.equal('afterSave');
      });
    });

    it ('should automatically set collection name', function *() {
      let account = new Account();
      yield account.save();

      account.collection.should.equal('accounts');

      let accounts = yield Account.find();
      accounts.length.should.equal(1);
    });
  });

  it ('should be able to use multiple databases', function *() {
    // Post1 will be stored in first database
    // Post2 will be stored in second database
    class Post1 extends Model {
      get db () {
        return Mongorito.db;
      }

      get collection () {
        return 'posts';
      }
    }

    let secondaryDb = Mongorito.connect('localhost/mongorito_test_2');

    class Post2 extends Model {
      get db () {
        return secondaryDb;
      }

      get collection () {
        return 'posts';
      }
    }

    yield Post1.remove();
    yield Post2.remove();

    let posts, post;

    post = new Post1({ title: 'Post in first db' });
    yield post.save();

    post = new Post2({ title: 'Post in second db' });
    yield post.save();

    posts = yield Post1.all();
    posts.length.should.equal(1);
    post = posts[0];
    post.get('title').should.equal('Post in first db');

    posts = yield Post2.all();
    posts.length.should.equal(1);
    post = posts[0];
    post.get('title').should.equal('Post in second db');

    secondaryDb.close();
  });

  describe ('Backwards compatibility', function () {
    it ('should work with old ES5-ish API', function *() {
      var Post = Model.extend({
        collection: 'posts'
      });

      var data = postFixture();
      var post = new Post(data);

      yield post.save();

      post.get('title').should.equal(data.title);
    });
  });

  after (function () {
    Mongorito.disconnect();
  });
});
