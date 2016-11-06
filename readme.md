# Mongorito [![Build Status](https://travis-ci.org/vdemedes/mongorito.svg?branch=master)](https://travis-ci.org/vdemedes/mongorito) [![Coverage Status](https://coveralls.io/repos/vdemedes/mongorito/badge.svg?branch=master&service=github)](https://coveralls.io/github/vdemedes/mongorito?branch=master)

> MongoDB ODM for Node.js apps.

Uses the official [mongodb](https://www.npmjs.com/package/mongodb) driver under the hood.

<h1 align="center">
  <br>
  <img width="200" src="media/logo.png">
  <br>
  <br>
</h1>


## Quick overview

```js
import Mongorito, {Model} from 'mongorito';

const db = new Mongorito('localhost/blog');
await db.connect();

class Post extends Model {
	
}

db.register(Post);

const post = new Post({
	title: 'Steve Angello rocks',
	author: {
		name: 'Emma'
	}
});

await post.save();
```


## Installation

```
$ npm install -- save mongorito
```


## Documentation

- [Connection](#connection)
- [Models](#models)
- [Attributes](#attributes)
- [Persistence](#persistence)
- [Queries](#queries)

### Connection

Connect to a `blog` database on `localhost`:

```js
const db = new Mongorito('localhost/blog');
await db.connect();

// ...

await db.disconnect();
```

### Models

Use classes to define models:

```js
class Post extends Model {
	
}

db.register(Post);
```

The example above defines model `Post` with documents in `posts` collection.
To use a custom collection, add `collection()` method, which returns the name of the desired collection:

```js
class Post extends Model {
	static collection () {
		return 'super_cool_posts';
	}
}

db.register(Post);
```

### Attributes

To create a new `Post` model instance:

```js
const post = new Post({
	title: 'Great title',
	author: {
		name: 'Emma'
	}
});
```

To get a specific attribute (even a nested one):

```js
post.get('title');
//=> 'Great title'

post.get('author.name');
//=> 'Emma'
```

All attributes can be retrieved at once using either `toJSON()` or `get()`:

```js
post.toJSON();
//=>
// {
// 	 title: 'Great title',
// 		 author: {
// 		 name: 'Emma'
// 	 }
// }

post.get();
//=> same as above
```

Set new values via `set()` method:

```js
post.set('title', 'New title');
post.set('author.name', 'Rachel');
```

To unset a value and remove it from a document:

```js
post.unset('title');
await post.save();
```

Models also keep track of previous and changed values.

```js
const post = new Post({title: 'Sad title'});

post.get('title');
//=> 'Sad title'

post.set('title', 'Happy title');
post.previous.get('title');
//=> 'Sad title'

post.changed('title');
//=> true
```

### Persistence

Use a `save()` method to create or update a document.
Mongorito detects whether it's a new document or not and executes
an appropriate operation.

```js
const post = new Post();

// create a new post
await post.save();

post.set('title', 'New title');

// update an existing post
await post.save();
```

To remove a document from collection:

```js
await post.remove();
```

You can also remove documents matching a certain criteria:

```js
await Post.remove({ title: 'New title' });
```

Or all remove all documents alltogether:

```js
await Post.remove();
```

### Queries

All queries return documents automatically wrapped into appropriate models.

#### Find all

```js
await Post.find();
```

#### Find one

```js
await Post.findOne({title: 'New title'});
```

#### Find by ID

```js
import {ObjectId} from 'mongorito';

const id = new ObjectId('56c9e0922cc9215110ab26dc');
await Post.findById(id);
```

#### Find where field's value equals another value

```js
await Post.find({title: 'New title'});

await Post.where('title', 'New title').find();
await Post.where('author.name', 'Emma').find();
```

#### Find where field's value matches a regular expression

```js
await Post.where('title', /something/i).find();
```

#### Find where field exists

```js
await Post.exists('title').find();
await Post.where('title').exists().find();
```

#### Find where field's value is less/greater than some value

```js
// `comments_number` less than 5
await Post.where('comments_number').lt(5).find(); 

// `comments_number` less than or equal 5
await Post.where('comments_number').lte(5).find();

// `comments_number` greater than 5
await Post.where('comments_number').gt(5).find();

// `comments_number` greater than or equal 5
await Post.where('comments_number').gte(5).find();
```

### Find where field's value is one of possible values

```js
await Post.where('comments_number').in([4, 8]).find();
```

### Find documents and include only certain fields

```js
await Post.include('title').find();
await Post.include(['title', 'is_featured']).find();
```

### Find documents and exclude certain fields

```js
await Post.exclude('title').find();
await Post.exclude(['title', 'is_featured']).find();
```

#### Find using OR

Find all documents where `title` equals either "First" or "Second":

```js
await Post.or([{ title: 'First' }, { title: 'Second' }]).find();
```

#### Limit results

```js
await Post.limit(10).find();
```

#### Skip results

Skip first N results:

```js
await Post.skip(4).find();
```

#### Sort results

```js
// descending
await Post.sort({comments_number: -1}).find();

// ascending
await Post.sort({comments_number: 1}).find();
```

#### Count results

Count all documents in collection:

```js
await Post.count();
```

Count all documents matching a certain criteria:

```js
await Post.count({ awesome: true });
```

### Search using text index

```js
await Post.search('Steve Angello')
	.sort('score', {$meta: 'textScore'})
	.include('score', {$meta: 'textScore'})
	.find();
```


## License

MIT © [Vadim Demedes](https://github.com/vdemedes)
