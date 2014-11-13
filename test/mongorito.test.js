var chai = require('chai');
var should = chai.should();
var chance = require('chance')();
var run = require('co');

var Mongorito = require('../');
var Model = Mongorito.Model;

/**
 * isGenerator polyfill
 * 
 * see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/isGenerator
 */
Function.prototype.isGenerator = function () {
	return /^function[\s]*\*/.test(this.toString());
};

/**
 * Make Mocha compatible with generators
 */
['it', 'before', 'after', 'beforeEach', 'afterEach'].forEach(function (name) {
	var originalFn = global[name];
	global[name] = function () {
		var args = Array.prototype.slice.call(arguments);
		var lastIndex = args.length - 1;
		var test = args[lastIndex];
		
		if (test.isGenerator()) {
			args[lastIndex] = function (done) {
				run(test).call(null, done);
			};
		}
		
		originalFn.apply(null, args);
	};
});

describe ('Mongorito', function () {
	var Post;
	
	before (function () {
		Mongorito.connect('localhost/mongorito_test');
	});
	
	before (function () {
		Post = Model.extend({
			collection: 'posts'
		});
	});
	
	beforeEach (function *() {
		yield Post.remove();
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
		
		it ('should create new a document', function *() {
			var data = postFixture();
			var post = new Post(data);
			yield post.save();
			
			var posts = yield Post.all();
			var createdPost = posts[0];
			
			posts.length.should.equal(1);
			createdPost.get('_id').toString().should.equal(post.get('_id').toString());
		});
		
		it ('should find all documents', function *() {
			var n = 10;
			var posts = [];
			
			while (n--) {
				var data = postFixture();
				var post = new Post(data);
				yield post.save();
				
				posts.push(post);
			}
			
			var posts = yield Post.all();
			posts.length.should.equal(10);
			posts.forEach(function (post, index) {
				post.get('_id').toString().should.equal(posts[index].get('_id').toString());
			});
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
		
		it ('should update a document', function *() {
			var data = postFixture();
			var post = new Post(data);
			yield post.save();
			
			var posts;
			
			posts = yield Post.all();
			posts.length.should.equal(1);
			
			var createdPost = yield Post.findOne();
			createdPost.get('_id').toString().should.equal(post.get('_id').toString());
			createdPost.get('title').should.equal(post.get('title'));
			
			var title = chance.sentence();
			post.set('title', title);
			yield post.save();
			
			posts = yield Post.all();
			posts.length.should.equal(1);
			
			var updatedPost = yield Post.findOne();
			updatedPost.get('_id').toString().should.equal(post.get('_id').toString());
			updatedPost.get('title').should.equal(post.get('title'));
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
	});
	
	after (function () {
		Mongorito.disconnect();
	});
});

function postFixture () {
	return {
		title: chance.sentence(),
		body: chance.paragraph()
	};
}