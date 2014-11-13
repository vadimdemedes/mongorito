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
		
		describe ('Hooks', function () {
			it ('should execute all hooks', function *() {
				var hooks = [];
				
				var Post = Model.extend({
					collection: 'posts',
					
					// Save hooks
					beforeSave: function *(next) {
						hooks.push('before:save');
						
						yield next;
					}.before('save'),
					
					afterSave: function *(next) {
						hooks.push('after:save');
						
						yield next;
					}.after('save'),
					
					aroundSave: function *(next) {
						hooks.push('around:save');
						
						yield next;
					}.around('save'),
					
					// Create hooks
					beforeCreate: function *(next) {
						hooks.push('before:create');
						
						yield next;
					}.before('create'),
					
					afterCreate: function *(next) {
						hooks.push('after:create');
						
						yield next;
					}.after('create'),
					
					aroundCreate: function *(next) {
						hooks.push('around:create');
						
						yield next;
					}.around('create'),
					
					// Update hooks
					beforeUpdate: function *(next) {
						hooks.push('before:update');
						
						yield next;
					}.before('update'),
					
					afterUpdate: function *(next) {
						hooks.push('after:update');
						
						yield next;
					}.after('update'),
					
					aroundUpdate: function *(next) {
						hooks.push('around:update');
						
						yield next;
					}.around('update'),
					
					// Remove hooks
					beforeRemove: function *(next) {
						hooks.push('before:remove');
						
						yield next;
					}.before('remove'),
					
					afterRemove: function *(next) {
						hooks.push('after:remove');
						
						yield next;
					}.after('remove'),
					
					aroundRemove: function *(next) {
						hooks.push('around:remove');
						
						yield next;
					}.around('remove'),
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
					
					firstBeforeSave: function *(next) {
						hooks.push('firstBeforeSave');
						
						throw new Error('firstBeforeSave failed.');
						
						yield next;
					}.before('save'),
					
					secondBeforeSave: function *(next) {
						hooks.push('secondBeforeSave');
						
						yield next;
					}.before('save')
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