require('chai').should();
require('mocha-generators')();

var chance = require('chance')();

var Mongorito = require('../');
var Model = Mongorito.Model;

/**
 * Fixtures
 */

var commentFixture = require('./fixtures/comment');
var postFixture = require('./fixtures/post');


/*
 * Tests
 */

describe ('Mongorito', function () {
	var Post, Comment;
	
	before (function () {
		Mongorito.connect('mongo://localhost/mongorito_test');
	});
	
	before (function () {
		Post = Model.extend({
			collection: 'posts',
			
			defaults: {
			  title: 'Default title'
			}
		});
		
		Comment = Model.extend({
			collection: 'comments'
		});
	});
	
	beforeEach (function *() {
		yield Post.remove();
		yield Comment.remove();
	});
	
	describe ('Model', function () {
		it ('should initialize model and manage attributes', function () {
			var data, post;
			
			data = postFixture();
			post = new Post(data);
			for (var key in post.get()) {
				post.get(key).should.equal(data[key]);
			}
			
			data = postFixture();
			post.set(data);
			for (var key in post.get()) {
				post.get(key).should.equal(data[key]);
			}
		});
		
		it ('should correctly convert model to JSON', function () {
			var data = postFixture();
			var post = new Post(data);
			
			var json = JSON.stringify(post);
			var parsed = JSON.parse(json);
			
			parsed.title.should.equal(data.title);
			parsed.body.should.equal(data.body);
		});
		
		it ('should remember previous attributes', function () {
		  var post = new Post({ title: 'Sad title' });
		  post.get('title').should.equal('Sad title');
		  post.set('title', 'Happy title');
		  post.previous.title.should.equal('Sad title');
		  post.changed.title.should.equal('Happy title');
		  post.get('title').should.equal('Happy title');
		});
		
		it ('should setup an index', function *() {
			yield Post.index('title');
			
			var indexes = yield Post.indexes();
			indexes.should.have.property('title_1');
		});
		
		it ('should create new a document', function *() {
			var timestamp = Math.round(new Date().getTime() / 1000);
			var data = postFixture();
			var post = new Post(data);
			yield post.save();
			
			var posts = yield Post.all();
			var createdPost = posts[0];
			
			posts.length.should.equal(1);
			createdPost.get('_id').toString().should.equal(post.get('_id').toString());
			createdPost.get('created_at').should.equal(timestamp);
			createdPost.get('updated_at').should.equal(timestamp);
		});
		
		it ('should create a new document with default values', function *() {
		  var data = postFixture();
		  delete data.title;
		  
		  var post = new Post(data);
		  yield post.save();
		  
		  post.get('title').should.equal('Default title');
		});
		
		it ('should update a document', function *() {
			var createdAt = Math.round(new Date().getTime() / 1000);
			var data = postFixture();
			var post = new Post(data);
			yield post.save();
			
			var posts;
			
			posts = yield Post.all();
			posts.length.should.equal(1);
			
			var createdPost = yield Post.findOne();
			createdPost.get('_id').toString().should.equal(post.get('_id').toString());
			createdPost.get('title').should.equal(post.get('title'));
			
			var updatedAt = Math.round(new Date().getTime() / 1000);
			
			var title = chance.sentence();
			post.set('title', title);
			yield post.save();
			
			posts = yield Post.all();
			posts.length.should.equal(1);
			
			var updatedPost = yield Post.findOne();
			updatedPost.get('_id').toString().should.equal(post.get('_id').toString());
			updatedPost.get('title').should.equal(post.get('title'));
			updatedPost.get('created_at').should.equal(createdAt);
			updatedPost.get('updated_at').should.equal(updatedAt);
		});
		
		it ('should remove a document', function *() {
			var post = new Post();
			yield post.save();
			
			var posts;
			
			posts = yield Post.all();
			posts.length.should.equal(1);
			
			var post = posts[0];
			yield post.remove();
			
			posts = yield Post.all();
			posts.length.should.equal(0);
		});
		
		it ('should remove many documents', function *() {
			var n = 10;
			
			while (n--) {
				var data = postFixture();
				var post = new Post(data);
				yield post.save();
			}
			
			var posts;
			
			posts = yield Post.all();
			posts.length.should.equal(10);
			
			yield Post.remove();
			
			posts = yield Post.all();
			posts.length.should.equal(0);
		});
		
		describe ('Queries', function () {
			it ('should find all documents', function *() {
				var n = 10;

				while (n--) {
					var data = postFixture();
					var post = new Post(data);
					yield post.save();
				}
				
				var posts = yield Post.all();

				var createdPosts = yield Post.find();
				createdPosts.length.should.equal(10);
				
				createdPosts.forEach(function (post, index) {
					post.get('_id').toString().should.equal(posts[index].get('_id').toString());
				});
			});
			
			it ('should count all documents', function *() {
				var n = 10;
				var createdPosts = [];

				while (n--) {
					var data = postFixture();
					var post = new Post(data);
					yield post.save();

					createdPosts.push(post);
				}
				
				var posts = yield Post.count();
				posts.should.equal(10);
			});

			it ('should find one document', function *() {
				var data = postFixture();
				var post = new Post(data);
				yield post.save();

				var posts = yield Post.all();
				posts.length.should.equal(1);

				var createdPost = yield Post.findOne();
				createdPost.get('_id').toString().should.equal(post.get('_id').toString());

				createdPost = yield Post.findOne({ title: post.get('title') });
				createdPost.get('_id').toString().should.equal(post.get('_id').toString());
			});
			
			it ('should find a document with .where()', function *() {
				var data = postFixture();
				var post = new Post(data);
				yield post.save();
				
				var posts = yield Post.where('title', data.title).find();
				posts.length.should.equal(1);
				
				var createdPost = posts[0];
				createdPost.get('_id').toString().should.equal(post.get('_id').toString());
			});
			
			it ('should find a document with .where() matching sub-properties', function *() {
				var data = postFixture();
				var post = new Post(data);
				yield post.save();
				
				var posts = yield Post.where('author.name', data.author.name).find();
				posts.length.should.equal(1);
				
				var createdPost = posts[0];
				createdPost.get('_id').toString().should.equal(post.get('_id').toString());
			});
			
			it ('should find a document with .where() matching sub-documents using elemMatch', function *() {
				var data = postFixture();
				var post = new Post(data);
				yield post.save();
				
				var posts = yield Post.where('comments', { body: data.comments[0].body }).find();
				posts.length.should.equal(1);
				
				var createdPost = posts[0];
				createdPost.get('_id').toString().should.equal(post.get('_id').toString());
			});
			
			it ('should find a document with .where() matching with regex', function *() {
				var data = postFixture({ title: 'Something' });
				var post = new Post(data);
				yield post.save();
				
				var posts = yield Post.where('title', /something/i).find();
				posts.length.should.equal(1);
				
				var createdPost = posts[0];
				createdPost.get('_id').toString().should.equal(post.get('_id').toString());
			});
			
			it ('should find documents with .limit()', function *() {
				var n = 10;
				
				while (n--) {
					var data = postFixture();
					var post = new Post(data);
					yield post.save();
				}
				
				var posts = yield Post.all();
				
				var createdPosts = yield Post.limit(5).find();
				createdPosts.length.should.equal(5);
				createdPosts.forEach(function (post, index) {
					post.get('_id').toString().should.equal(posts[index].get('_id').toString());
				});
			});
			
			it ('should find documents with .limit() and .skip()', function *() {
				var n = 10;
				
				while (n--) {
					var data = postFixture();
					var post = new Post(data);
					yield post.save();
				}
				
				var posts = yield Post.all();
				
				var createdPosts = yield Post.limit(5).skip(5).find();
				createdPosts.length.should.equal(5);
				createdPosts.forEach(function (post, index) {
					post.get('_id').toString().should.equal(posts[5 + index].get('_id').toString());
				});
			});
			
			it ('should find documents with .exists()', function *() {
				var n = 10;
				
				while (n--) {
					var data = postFixture();
					if (n < 5) {
						delete data.body;
					}
					
					var post = new Post(data);
					yield post.save();
				}
				
				var posts;
				
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
				var n = 10;
				
				while (n--) {
					var data = postFixture({ index: n });
					var post = new Post(data);
					yield post.save();
				}
				
				var posts;
				
				posts = yield Post.where('index').lt(5).find();
				posts.length.should.equal(5);
				
				posts = yield Post.where('index').lte(5).find();
				posts.length.should.equal(6);
				
				posts = yield Post.where('index').gt(7).find();
				posts.length.should.equal(2);
				
				posts = yield Post.where('index').gte(7).find();
				posts.length.should.equal(3);
			});
			
			it ('should find documents with .in()', function *() {
				var n = 10;
				
				while (n--) {
					var data = postFixture({ index: n });
					var post = new Post(data);
					yield post.save();
				}
				
				var posts = yield Post.where('index').in([4, 5]).find();
				posts.length.should.equal(2);
			});
			
			it ('should sort documents', function *() {
			  var n = 10;
			  
			  while (n--) {
			    var data = postFixture({ index: n });
			    var post = new Post(data);
			    yield post.save();
			  }
			  
			  var posts = yield Post.sort({ _id: -1 }).find();
			  posts.length.should.equal(10);
			  
			  n = 10;
			  
			  while (n--) {
			    var post = posts[n];
			    post.get('index').should.equal(n);
			  }
			  
			  posts = yield Post.sort({ _id: 1 }).find();
			  posts.length.should.equal(10);
			  
			  n = 10;
			  
			  while (n--) {
			    var post = posts[n];
			    post.get('index').should.equal(9 - n);
			  }
			});
			
			it ('should populate the response', function *() {
				var n = 3;
				var comments = [];
				
				while (n--) {
					var data = commentFixture();
					var comment = new Comment(data);
					yield comment.save();
					
					comments.push(comment);
				}
				
				var data = postFixture({
					comments: comments.map(function (comment) { return comment.get('_id'); })
				});
				var post = new Post(data);
				yield post.save();
				
				var createdPost = yield Post.populate('comments', Comment).findOne();
				createdPost.get('comments').forEach(function (comment, index) {
					comment.get('_id').toString().should.equal(comments[index].get('_id').toString());
				});
				
				// now confirm that populated documents
				// don't get saved to database
				yield createdPost.save();
				
				createdPost = yield Post.findOne();
				createdPost.get('comments').forEach(function (id, index) {
					id.toString().should.equal(comments[index].get('_id').toString());
				});
			});
		});
		
		describe ('Hooks', function () {
			it ('should execute all hooks', function *() {
				var hooks = [];
				
				var Post = Model.extend({
					collection: 'posts',
					
					configure: function () {
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
					},
					
					// Save hooks
					beforeSave: function *(next) {
						hooks.push('before:save');
						
						yield next;
					},
					
					afterSave: function *(next) {
						hooks.push('after:save');
						
						yield next;
					},
					
					aroundSave: function *(next) {
						hooks.push('around:save');
						
						yield next;
					},
					
					// Create hooks
					beforeCreate: function *(next) {
						hooks.push('before:create');
						
						yield next;
					},
					
					afterCreate: function *(next) {
						hooks.push('after:create');
						
						yield next;
					},
					
					aroundCreate: function *(next) {
						hooks.push('around:create');
						
						yield next;
					},
					
					// Update hooks
					beforeUpdate: function *(next) {
						hooks.push('before:update');
						
						yield next;
					},
					
					afterUpdate: function *(next) {
						hooks.push('after:update');
						
						yield next;
					},
					
					aroundUpdate: function *(next) {
						hooks.push('around:update');
						
						yield next;
					},
					
					// Remove hooks
					beforeRemove: function *(next) {
						hooks.push('before:remove');
						
						yield next;
					},
					
					afterRemove: function *(next) {
						hooks.push('after:remove');
						
						yield next;
					},
					
					aroundRemove: function *(next) {
						hooks.push('around:remove');
						
						yield next;
					},
				});
				
				var data = postFixture();
				var post = new Post(data);
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
				var hooks = [];
				
				var Post = Model.extend({
					collection: 'posts',
					
					configure: function () {
					  this.before('save', 'firstBeforeSave');
					  this.before('save', 'secondBeforeSave');
					},
					
					firstBeforeSave: function *(next) {
						hooks.push('firstBeforeSave');
						
						throw new Error('firstBeforeSave failed.');
						
						yield next;
					},
					
					secondBeforeSave: function *(next) {
						hooks.push('secondBeforeSave');
						
						yield next;
					}
				});
				
				var posts;
				
				posts = yield Post.all();
				posts.length.should.equal(0);
				
				var data = postFixture();
				var post = new Post(data);
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
		});
	});
	
	it ('should be able to use multiple databases', function *() {
		// Post1 will be stored in first database
		// Post2 will be stored in second database
		var Post1 = Mongorito.Model.extend({
			db: Mongorito.db,
			collection: 'posts'
		});
		
		var secondaryDb = Mongorito.connect('localhost/mongorito_test_2');
		
		var Post2 = Mongorito.Model.extend({
			db: secondaryDb,
			collection: 'posts'
		});
		
		yield Post1.remove();
		yield Post2.remove();
		
		var posts, post;
		
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
	
	after (function () {
		Mongorito.disconnect();
	});
});