---
title: Middleware
description: See how you can use middleware for validation, checking data consistency and other.
---

# Middleware

After reading this guide you will know:

1. How to configure middleware in models
2. Abort the operation and throw error
3. Use an alternative API for defining middleware

> This guide assumes that you have a basic knowledge of Mongorito and you've already read [Getting Started](/guides/getting-started) guide.

### Configuration

Middleware is a known concept to Node.js community.
It's basically a chain of functions that execute sequentially and change the state of context.
Mongorito implements the same behavior.
Whether you are creating, updating or removing documents, you can "inject" a function in the chain.
This could be useful for validation, data consistency confirmation, checking for existing data, hooks for other events, etc.

> Every middleware function **must** be a generator function.

Let's define a Post model for our examples:

```javascript
var Post = Mongorito.Model.extend({
	collection: 'posts'
});
```

Now, let's see how a Post model will look with a pre-create middleware:

```javascript
var Post = Mongorito.Model.extend({
	collection: 'posts',
	
	configure: function () {
		this.before('create', 'checkIfExists');
	},
	
	checkIfExists: function *(next) {
		// checking if post with the
		// same title exists in database
		
		yield next;
	}
});
```

In this model, ==.configure()== method is like a constructor, it is executed when a new instance of Post model is created.
In this method, you should "register" your middleware.
Every middleware function accepts only one argument, ==next== callback, which should be called when function had done its job.

There are 3 frames, where you can inject middleware: *before*, *after* and *around*.
Last one, *around*, is the mix of *before* and *after*, which means that middleware registered with *around* will be executed twice, before and after the operation.

There are 4 events, when middleware can be triggered: *save*, *create*, *update* and *remove*.
If middleware registered to trigger on *save*, it will be triggered on both *create* and *update* events.

Here's the full example of ==.configure()== on how you may register middleware:

```javascript
configure: function () {
	this.before('create', 'executesBeforeCreate');
	this.around('update', 'executesAroundUpdate');
	this.after('remove', 'executesAfterRemove');
}
```

> Middleware gets executed automatically. Keep using the same API for managing data just like before.

### Aborting the operation

There are times, when you need to prevent the main operation (save, remove) from happening.
For example, after failed validation of incoming data.
To abort middleware chain and prevent operation from executing, just throw an error, like you usually do:

```javascript
var Post = Mongorito.Model.extend({
	collection: 'posts',
	
	configure: function () {
		this.before('save', 'validate');
	},
	
	validate: function *(next) {
		var isValid = true;
		
		// let's assume that validation went wrong
		// and isValid is set to false here
		
		if (!isValid) {
			throw new Error('Post title is missing');
		}
		
		yield next;
	}
});

var post = new Post();
yield post.save();
```

After the *Error* is thrown, nothing will be executed.
Use *try/catch* construction to catch errors.


### Alternative API for middleware

There is also prettier and simpler alternative API for registering middleware, inspired by Ember.js.
If you are using this API, you don't need .configure() method.

```javascript
var Post = Mongorito.Model.extend({
	collection: 'posts',
	
	validate: function *(next) {
		var isValid = false;
		
		if (!isValid) {
			throw new Error('Post title is missing');
		}
	}.before('save')
});
```

> It is recommended to use the original API with ==.configure()== method.