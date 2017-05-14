<h1 align="center">
  <br>
  <img width="400" src="media/logo.png">
  <br>
  <br>
</h1>

> Lightweight and flexible MongoDB ODM for Node.js apps based on Redux.

[![Build Status](https://travis-ci.org/vadimdemedes/mongorito.svg?branch=master)](https://travis-ci.org/vadimdemedes/mongorito) [![Coverage Status](https://coveralls.io/repos/vadimdemedes/mongorito/badge.svg?branch=master&service=github)](https://coveralls.io/github/vadimdemedes/mongorito?branch=master)


## Features

**Flexible**

Mongorito is based on [Redux](https://github.com/reactjs/redux), which opens the doors for customizing literally everything - from model's state (reducers) to the behavior of core methods, like `set()`, `save()` or `find()`.

Each model instance has a separate Redux store, which ensures isolation between other models and easy extensibility.

**No schemas**

If MongoDB doesn't enforce schemas, why would Mongorito do? Enjoy the schema-free data management with Mongorito the same way you do in `mongo` console.

**Lightweight**

Mongorito is betting on 3rd-party plugins to deliver extra functionality to developers. Mongorito ships with a barebones model with basic get/set, save/remove and querying functionality and let's you be in control of what's included and what's not.

Mongorito is basically a tiny Redux-based application, which uses the official MongoDB driver and [mquery](https://github.com/aheckmann/mquery) for querying. Not that amount of lines are relevant when measuring complexity, but each file (module) is less than 300 lines. Check out the source code and see for yourself!


## Quick overview

```js
const {Database, Model} = require('mongorito');

const db = new Database('localhost/blog');
await db.connect();

class Post extends Model {}

db.register(Post);

const post = new Post({
	title: 'Steve Angello rocks',
	author: {
		name: 'Emma'
	}
});

await post.save();

post.set('author.name', 'Rick');
await post.save();
```

*Note*: `await` won't work at top level, it's used to reduce the complexity of an example.


## Installation

```
$ npm install --save mongorito
```


## Contents

- [Connection](#connection)
- [Models](#models)
- - [Creating a model](#creating-a-model)
- - [Working with fields](#working-with-fields)
- - [Saving or removing documents](#saving-or-removing-documents)
- - [Incrementing fields](#incrementing-fields)
- - [Embedding other models](#embedding-other-models)
- - [Configuration](#configuration)
- [Queries](#queries)
- [Plugins](#plugins)
- - [Using plugins](#using-plugins)
- - [Writing plugins](#writing-plugins)
- - [Extending model with new methods](#extending-model-with-new-methods)
- - [Modifying model's state](#modifying-models-state)
- - [Changing behavior using middleware](#changing-behavior-using-middleware)
- [Migrating from legacy version](#migrating-from-legacy-version)


## Connection

Mongorito exports several own classes, as well as a few properties from the MongoDB driver:

```js
const {
	Database,
	Model,
	Timestamp,
	ObjectId,
	MinKey,
	MaxKey,
	DBRef,
	Long
} = require('mongorito');
```

`Database` and `Model` are Mongorito's own exports, all the other ones are exported straight from [`mongodb`](https://github.com/mongodb/node-mongodb-native) package for convenience. Normally, you'd need only `Database`, `Model` and `ObjectId`.

To connect, initialize a `Database`, which accepts a MongoDB connection string and use `connect()` method, which returns a Promise.

For convenience, `await` will be used in all examples below, even though it doesn't work at top level.

```js
const {Database, Model} = require('mongorito');

const db = new Database('localhost/blog');
await db.connect();
```

You don't have to wait until connection establishes to perform operations. Mongorito automatically executes pending operations once connection is up.

## Models

### Creating a model

Model is the connection between your data and a database. Each model represents a single collection. Model is a simple class, which doesn't even need to have any properties or methods.

```js
class Post extends Model {}
```

For `Post` model to work and be aware of the database it's connected to, make sure to register it in the database we created earlier.

```js
db.register(Post);
```

That's it, the `Post` model is good to go!

### Working with fields

To create a new document, create an instance of `Post` model.

```js
const post = new Post();
```

Model's constructor also accepts an object of fields to instantiate the document with:

```js
const post = new Post({
	title: 'Great post',
	author: {
		name: 'Sarah'
	}
});
```

Note, documents can contain nested fields and even models, just like in MongoDB.

To get one or all fields from the `post` document, use a `get()` method.

```js
const title = post.get('title');
//=> "Great post"

const author = post.get('author.name');
//=> "Sarah"

const data = post.get();
//=>
//  {
//    title: "Great post"
//    author: {
//      name: "Sarah"
//    }
//  }
```

Similarly, use `set()` to update fields:

```js
// update fields one by one
post.set('title', 'Amazing post');
post.set('author.name', 'Monica');

// or all at once
post.set({
	title: 'Amazing post',
	author: {
		name: 'Monica'
	}
});
```

To remove a field, use `unset()`:

```js
// unset single fields
post.unset('title');
post.unset('author.name');

// or multiple fields at once
post.unset(['title', 'author.name']);
```

### Saving or removing documents

To create or update documents, simply call `save()`. Even though Mongorito differentiates these two operations internally, you don't have to care about that! Mongorito also infers the collection name from the model, so the instances of the model `Post` will be saved to `posts` collection.

```js
await post.save();
```

When a document is saved, an `_id` field is automatically added.

```js
post.get('_id');
//=> ObjectId("5905cb6b543c3a50e03e810d")
```

To remove a document, use `remove()`.

```js
await post.remove();
```

To remove multiple documents, use `remove()` on the model itself with a query as an argument.

```js
await Post.remove({good: false});
```

### Incrementing fields

Mongorito also provides a handy `increment()` method to increment or decrement numerical fields:

```js
const post = new Post({
	views: 0
});

await post.increment('views');

post.get('views');
//=> 1
```

You can also supply a value to increment a field by a specific amount.

```js
await post.increment('views', 2);

post.get('views');
//=> 3
```

Multiple fields can be incremented at once, too.

```js
const post = new Post({
	views: 10,
	comments: 10
});

await post.increment({
	views: 2,
	comments: 5
});

post.get('views');
//=> 12

post.get('comments');
//=> 15
```

### Embedding other models

Just like MongoDB, Mongorito allows to effortlessly embed other models. They're transparently converted between JSON and Mongorito models.

To embed models, use `embeds()` method on the model itself to help Mongorito with the model serialization when saving/reading from the database. `embeds()` method accepts a field name, where the embedded document (or array of documents) resides.

Here's the quick overview on how it works. Note, that model registering via `register()` is skipped in the following example.

```js
class Post extends Model {}
class Author extends Model {}
class Comment extends Model {}

Post.embeds('author', Author);
Post.embeds('comments', Comment);

const post = new Post({
	title: 'Great post',
	author: new Author({name: 'Steve'}),
	comments: [new Comment({body: 'Interesting!'})]
});

await post.save();
```

The above post will be saved to the database as:

```json
{
	"title": "Great post",
	"author": {
		"name": "Steve"
	},
	"comments": [
		{
			"body": "Interesting!"
		}
	]
}
```

You can also just pass objects instead of model instances and Mongorito will take care of that too.

```js
const post = new Post({
	title: 'Great post',
	author: {
		name: 'Steve'
	},
	comments: [{
		body: 'Interesting!'
	}]
});
```

When that document will be retrieved from the database next time, all embedded documents will be wrapped with their corresponding models.

```js
const post = await Post.findOne();

const author = post.get('author');
//=> Author { name: "Steve" }

author.get('name');
//=> "Steve"
```

### Configuration

#### Using a different collection name

In case you need to store documents in a custom collection, you can override the default one using `collection()` method.

```js
class Post extends Model {
	collection() {
		return 'awesome_posts';
	}
}
```

## Queries

Mongorito uses [mquery](https://github.com/aheckmann/mquery) to provide a simple and comfortable API for querying. It inherits all the methods from `mquery` with a few exceptions, which will be documented below. For documentation, please check out mquery's API - https://github.com/aheckmann/mquery.

Here's a quick overview of how querying works in Mongorito. All documents returned from queries are automatically wrapped into their models.

```js
// find all posts
await Post.find();

// find all amazing posts
await Post.find({amazing: true});
await Post.where('amazing', true).find();

// find 5 recent posts
await Post
	.limit(5)
	.sort('created_at', 'desc')
	.find();

// find one post
await Post.findOne({incredible: 'yes'});

// count posts
await Post.count({super: false});
```

## Plugins

### Using plugins

To use a 3rd-party plugin, all you have to do is to call `use()` method.

```js
const timestamps = require('mongorito-timestamps');

db.use(timestamps);
```

This will apply [mongorito-timestamps](https://github.com/vadimdemedes/mongorito-timestamps) to models registered after that.

If you want to apply the plugin to a specific model only, call it on the model itself.

```js
Post.use(timestamps);
```

### Writing plugins

A plugin is simply a function that accepts a model. A familiarity with Redux and its concepts will help you tremendously with writing plugins.

```js
const myPlugin = model => {
	// do anything with model (Post, in this case)
};

Post.use(myPlugin);
```

Feel free to assign new methods to the model or instances, add new middleware, modify the model's state and anything that comes to your mind.

### Extending model with new methods

Here's an example of adding a class method and an instance method to a `Post` model.

```js
const extendPost = Post => {
	Post.findRecent = function () {
		return this
			.limit(5)
			.sort('created_at', 'desc')
			.find();
	};

	Post.prototype.makeAmazing = function () {
		this.set('amazing', true);
	};
};

Post.use(extendPost);

const post = new Post();
post.makeAmazing();
post.get('amazing');
//=> true

const posts = await Post.findRecent();
//=> [Post, Post, Post]
```

### Modifying model's state

If you plugin needs to have its own state, you can modify the model's reducer using `modifyReducer()` method. It accepts a function, which receives the existing reducer shape as an argument and should return a new object with added reducers.

```js
const customReducer = (state = null, action) => {
	// reducer code...
};

const extendReducer = model => {
	model.modifyReducer(reducer => {
		return {
			...reducer,
			customState: customReducer
		}
	});
};
```

### Changing behavior using middleware

Middleware can be used to change or modify the behavior of model's operations. You can interact with everything, from get/set operations to queries.

To add plugin's custom middleware to the default middleware stack, return it from the plugin function.

```js
const myPlugin = () => {
	return store => next => action => {
		// middleware code...
	};
};
```

Obviously, to detect what kind of action is being handled, you need to be aware of Mongorito's action types.

```js
const {ActionTypes} = require('mongorito');

const myPlugin = () => {
	return store => next => action => {
		if (action.type === ActionTypes.SET) {
			// alter set() behavior
		}

		return next(action);
	};
};
```

Again, the middleware is identical to the middleware you're used to when writing apps with Redux. There are only 2 new properties added to the `store`:

- `model` - instance of the model (document) the middleware is currently running in. If middleware is running at the model level (without instantiated model), it will be `undefined`.
- `modelClass` - model class (`Post`, for example).

Here's an example on how to access all props of the store:

```js
const myPlugin = () => {
	return ({getState, dispatch, model, modelClass}) => next => action => {
		// `getState()` and `dispatch()` are from Redux itself
		// `model` is `post`
		// `modelClass` is `Post`

		return next(action);
	};
};

Post.use(myPlugin);

const post = new Post();
await post.save();
```

For examples on how to write middleware, check out Mongorito's native ones - https://github.com/vadimdemedes/mongorito/tree/master/lib/middleware.


## Migrating from legacy version

### Connection

Before:

```js
const mongorito = require('mongorito');

mongorito.connect('localhost/blog');
```

After:

```js
const {Database} = require('mongorito');

const db = new Database('localhost/blog');
await db.connect();
```


## License

MIT © [Vadim Demedes](https://github.com/vadimdemedes)
