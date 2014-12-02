---
title: Queries
description: Find out how to query database via Mongorito's flexible and beautiful API.
---

# Queries

After reading this guide you will know:

1. How to query documents from a database
2. Execute *where* queries with strings, objects and regular expressions
3. Paginate documents
4. Use $lt, $lte, $gt, $gte
5. Use $in and $nin

> This guide assumes that you have a basic knowledge of Mongorito and you've already read [Getting Started](/guides/getting-started) guide.

### Finding documents

There are multiple ways of fetching records from the database in Mongorito.
Let's break it all down into a simple list for easier understanding of methods and their alternatives.

> I assume that you've already set up Post model.

#### Find all

Finds all documents in collection.

```javascript
var posts = yield Post.all();
```

Alternative:

```javascript
var posts = yield Post.find();
```

> Queries **always** return an array

#### Find where

Finds document in collection, that match certain criteria.
Example, that fetches all documents where *title* equals 'Great title':

```javascript
var posts = yield Post.find({ title: 'Great title' ));
```

Alternatives:

```javascript
var posts = yield Post.where('title', 'Great title').find();
var posts = yield Post.where('title').equals('Great title').find();
```

Fetch all documents where sub-property *name* of property *author* equals 'John Doe':

```javascript
var posts = yield Post.where('author.name', 'John Doe').find();
```

Fetch documents, where sub-documents match a criteria:

```javascript
// matching posts where at least one comment.body is "Nice comment"
var posts = yield Post.where('comments', { body: 'Nice comment' }).find();
```

Fetch documents with a regular expression:

```javascript
var posts = yield Post.where('title', /great/i).find();
```

#### Find where field exists

Find documents where field *title* exists:

```javascript
var posts = yield Post.where('title').exists().find();
```

#### Find where field passes logical operator

There are 4 types of logical operators available:

1. Greater than (>, $gt)
2. Greater or equal than (>=, $gte)
3. Less than (<, $lt)
4. Less or equal than (<=, $lte)

Example:

```javascript
var posts = yield Post.where('position').gt(5).find();
var posts = yield Post.gt('position', 5).find();
```

#### Find using "in" or "not in"

Find documents where field value is in or not in supplied array:

```javascript
var posts = yield Post.where('title').in(['First title', 'Second title']).find();
```

This will find all post documents where *title* equals 'First title' or 'Second title'.

### Pagination

Pagination in MongoDB database is based on ==.skip() and .limit()== methods:

```javascript
var posts = yield Post.limit(5).skip(10).find();
```

This tells MongoDB to return **5** post documents, while skipping **first 10**.