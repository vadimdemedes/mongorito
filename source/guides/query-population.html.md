---
title: Query Population
description: Replace references to documents from other collections with actual documents in query response.
---

# Query Population

After reading this guide you will know:

1. How to populate query response with other models
2. Save yourself a shitload of time

> This guide assumes that you have a basic knowledge of Mongorito and you've already read [Getting Started](/guides/getting-started) guide.

### What is Query Population?

Idea of query population was borrowed from the awesome [Mongoose](http://mongoosejs.com/docs/populate.html) (Thank you!).
Query population comes really handy when in query response you have references to documents in other collections (ObjectIDs, for example) and you need to query those documents too in order to get a complete data.

Let's take a look at this example to get a better understanding. Imagine you have such Post document in a database:

```json
{
    "_id": ObjectId("5234d25244e937489c000004"),
    "title": "Great title",
    "body": "Great body",
    "comments": [
        ObjectId("5234d25244e937489c000005"),
        ObjectId("5234d25244e937489c000006"),
        ObjectId("5234d25244e937489c000007")
    ]
}
```

And there are Post and Comment models defined:

```javascript
var Model = Mongorito.Model;

class Post extends Model {
	
}

class Comment extends Model {
	
}
```

Now, to fetch this post and its comments normally you would do this (or something like this):

```javascript
var post = yield Post.findOne();
var comments = post.get('comments');

var index = 0;
var commentId;

while (commentId = comments[index]) {
	comments[index] = yield Comment.findById(commentId);
	
	index++;
}
```

First, you fetch a post document. Then, you iterate over comments array and for each comment id fetch a comment document.
With populating, you don't need to write all that and instead just do this:

```javascript
var post = yield Post.populate('comments', Comment).findOne();
var comments = post.get('comments);
```

Here, ==.populate()== method tells a query, that ==comments== field in the response needs to be replaced with documents fetched using ==Comment== model. Yes, that easy.

> When you will try to save a document, which contains field(s) that were populated, they will be converted back to ObjectIDs, so document state will be the same before population.