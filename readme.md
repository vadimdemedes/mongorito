# Mongorito

[![Build Status](https://travis-ci.org/vdemedes/mongorito.svg?branch=master)](https://travis-ci.org/vdemedes/mongorito)
[![Coverage Status](https://coveralls.io/repos/vdemedes/mongorito/badge.svg?branch=master&service=github)](https://coveralls.io/github/vdemedes/mongorito?branch=master)

Awesome MongoDB ODM for Node.js apps.
Just take a look at its beautiful models and API.

Uses official [mongodb](https://www.npmjs.com/package/mongodb) driver under the hood.

<h1 align="center">
  <br>
  <img width="200" src="media/logo.png">
  <br>
  <br>
</h1>


## Quick overview

```js
const mongorito = require('mongorito');
const Model = mongorito.Model;

class Post extends Model {
	
}

mongorito.connect('localhost/blog');

let post = new Post({
	title: 'Steve Angello rocks',
	author: {
		name: 'Emma'
	}
});

post.save();
// post saved
```


## Features

- Based on Promises, which means **no callbacks**
- Established API you've already used to
- Hooks (before:save, around:create, after:remove, etc)
- Fully covered by tests
- Using this module results in a beautiful code


## Installation

```
$ npm install mongorito --save
```


## Usage

- [Connection](#connection)
- [Models](#models)
- [Attributes](#attributes)
- [Save & remove](#save--remove)
- [Queries](#queries)

### Connection

*Check out [connection](examples/connection.js) example.*

Here's how to connect to a `blog` database on `localhost`:

```js
await mongorito.connect('localhost/blog');
```

To disconnect, use `mongorito.disconnect()`:

```js
await mongorito.disconnect();
```

### Models

Use classes to define models:

```js
const Model = mongorito.Model;

class Post extends Model {
	
}
```

This defines model `Post` with documents in `posts` collection.
To use a custom collection, add `collection()` method, which returns the name of the desired collection:

```js
class Post extends Model {
	collection () {
		return 'super_cool_posts';
	}
}
```

Mongorito models can also be defined old-fashioned Backbone way:

```js
const Post = Model.extend({
	collection: 'posts'
});
```

**Note**: `collection` property has to be set.

### Attributes

*Check out [attributes](examples/attributes.js) example.*

To create a new instance of a model, simply use `new`:

```js
let post = new Post({
	title: 'Great title',
	author: {
		name: 'Emma'
	}
});
```

To retrieve a specific attribute (even a nested one):

```js
let title = post.get('title');
let author = post.get('author.name');
```

All attributes can be retrieved at once using either `toJSON()` or `get()`:

```js
let attrs = post.toJSON();
let attrs = post.get();
```

Set new values via `set()` method:

```js
post.set('title', 'New title');
post.set('author.name', 'Rachel');
```

### Save & Remove

*Check out [manage](examples/manage.js) example.*

Use a `save()` method to create/update (Mongorito handles that for you) a model:

```js
let post = new Post();

await post.save(); // creates a new post

post.set('title', 'New title');
await post.save(); // updates an existing post
```

To remove a model from collection:

```js
await post.remove();
```

You can also remove all models matching a certain criteria:

```js
await Post.remove({ title: 'New title' });
```

### Queries

#### Find all

To fetch all models `find()` or `all()` can be used (they're identical):

```js
Post.find();
Post.all();
```

#### Find one

```js
Post.findOne({ title: 'New title' });
```

#### Find by ID

```js
Post.findById('56c9e0922cc9215110ab26dc');
```

#### Find where value equals

```js
Post.where('title', 'New title').find();
Post.where('author.name', 'Emma').find();
```

#### Find where value matches a regular expression

```js
Post.where('title', /something/i).find();
```

#### Find where attribute exists

```js
Post.exists('title').find();
```

#### Find where value is less/greater than

```js
Post.where('comments_number').lt(5).find(); // less than 5
Post.where('comments_number').lte(5).find(); // less than or equal 5
Post.where('comments_number').gt(5).find(); // greater than 5
Post.where('comments_number').gte(5).find(); // greater than or equal 5
```

### Find where value is one of

```js
Post.in('comments_number', [4, 8]).find();
```

#### Find using OR

Find all models where `title` equals either "First" or "Second":

```js
Post.or({ title: 'First' }, { title: 'Second' }).find();
```

#### Limit results

```js
Post.limit(10).find();
```

#### Skip results

Skip first N results:

```js
Post.skip(4).find();
```

#### Sort results

```js
// descending
Post.sort('comments_number', -1);

// ascending
Post.sort('comments_number', 1);
```

#### Count results

Count all documents in collection:

```js
Post.count();
```

Count all documents matching a certain criteria:

```js
Post.count({ awesome: true });
```


## Tests

```
$ npm test
```


## License

Mongorito is released under the MIT License.
