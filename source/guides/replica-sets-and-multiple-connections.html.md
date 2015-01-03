---
title: Replica sets and multiple connections
description: Connect to replica sets. Maintain multiple connections at the same time for different models.
---

# Replica sets and multiple connections

After reading this guide you will know:

1. How to connect to a replica set
2. Manage multiple connections

> This guide assumes that you have a basic knowledge of Mongorito and you've already read [Getting Started](/guides/getting-started) guide.

### Replica sets

According to MongoDB documentation:

> A replica set in MongoDB is a group of mongod processes that maintain the same data set. Replica sets provide redundancy and high availability, and are the basis for all production deployments.

To connect to replica sets, simply pass URLs to servers to ==Mongorito.connect()== method, like this:

```javascript
Mongorito.connect('host1/blog', 'host2/blog');
```

Done.

### Multiple connections

There might be situations, where you will need to use separate databases for different models.
To open connections to different hosts and databases, use the same ==Mongorito.connect()== method.
First call to .connect() method will set a default connection for all models.
All subsequent calls will not modify existing connection, but return it, so that you can use it in your models:

```javascript
Mongorito.connect('localhost/default_db');

var secondaryDb = Mongorito.connect('localhost/other_db');
```

Now, to tell specific models to use connection to *secondaryDb* instead of default, set ==db== property, like that:

```javascript
var Model = Mongorito.Model;

class Post extends Model {
	get collection () {
		return 'posts';
	}
}

class Comment extends Model {
	get collection () {
		return 'comments';
	}
	
	get db () {
		return secondaryDb;
	}
}
```

Post model will talk to default database, while Comment model will communicate with *secondaryDb*. 