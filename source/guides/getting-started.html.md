---
title: Getting Started
description: Learn how to get started with Mongorito and build a theoretical blog application.
---

# Getting Started

After reading this guide you will know:

1. How to install Mongorito and deal with generators
2. Connect to a database
3. Define a model
4. Create and update documents
5. Query database

### Installation

Before we start doing anything, we need to ensure that we've got Node.js **v0.11.x or newer** installed:

```bash
$ node -v
```

If you've got v0.10.x or lower, you need to upgrade to the latest **unstable** (stable version 0.12 is coming soon) version of Node.js.
If you need to maintain multiple versions on your system, I recommend using either [nvm](https://github.com/creationix/nvm) or [n](https://github.com/tj/n).

Also, beware that when you want ES6 features to be enabled, you should run your programs with ==-\\\-harmony== option, like this:

```bash
$ node --harmony script.js
```

In addition to all that, all code that contains generators and **yield** statements needs to be wrapped into [co](https://github.com/tj/co) or similar tools, that handle generators.
This may be confusing at first, but in practice, it is very simple.
Read [co's](https://github.com/tj/co) Readme.md to understand how it works better.

To install Mongorito via npm:

```bash
$ npm install mongorito --save
```

Great, now let's build some theoretical blog application and see how Mongorito would handle management of posts.

### Connecting to database

Use ==Mongorito.connect()== method to connect to a database.

> Mongorito provides support for single connections, replica sets (same database) and multiple connections to different databases. Check out [Replica sets and multiple connections](/guides/replica-sets-and-multiple-connections) guide, where all those cases are described in detail.

So, getting back to our tutorial.
I also recommend to assign ==Mongorito.Model== to a separate variable (preferably, Model) to create a shortcut for quicker access.

```javascript
var Mongorito = require('mongorito');
var Model = Mongorito.Model;

Mongorito.connect('localhost/blog');
```

Here, we connected to *blog* database on *localhost* host.
You don't need to wait for some callback to fire in order to start querying database.
All operations are buffered, so when connection becomes available, they will be executed.

### Defining a model

To define a Post model, use ==Model.extend()== method to inherit from Model.
When extending, you must set a collection name in ==collection== property.
You do not need to register a model or anything like that.

```javascript
var Post = Model.extend({
	collection: 'posts'
});
```

> There is no need to define schema or even fields that belong to this model. One of the main features of MongoDB is that it's schema-less and Mongorito does not want to take that feature away from you.

After Post model is defined, you can start using it right away.
All documents will be saved in the collection you specified in ==collection== property (posts, in this example).

### Saving documents

To save a Post document, create a new instance of Post model and execute ==.save()== method.

```javascript
var post = new Post({
	title: 'Node.js with --harmony rocks!',
	body: 'Long post body',
	author: {
		name: 'John Doe'
	}
});

yield post.save();
```

To update a document, use ==.set()== and call ==.save()== method after that.
It will automatically detect that this document already exists and instead of creating a new one, it should update it.

```javascript
post.set('title', 'Post got a new title!');
post.set('author.name', 'Doe John');

yield post.save();
```

### Queries

Now we are going to find all posts in the database.
The returned array contains documents wrapped into Post model.

```javascript
var posts = yield Post.all();
```

To find all posts where body equals "Long post body" or posts where author's name equals "John Doe", use ==.where()== method.

```javascript
var posts;

// find posts where body equals "Long post body"
posts = yield Post.where('body', 'Long post body').find();

// find posts where author's name equals "John Doe"
posts = yield Post.where('author.name', 'John Doe').find();

// Bonus: find posts where title starts with "Node"
posts = yield Post.where('title', /^node/i).find();
```

When all the work is done, don't forget to close connection to MongoDB.

```javascript
Mongorito.disconnect();
```