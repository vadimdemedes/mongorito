# Mongorito

Awesome ES6 generator-based MongoDB ODM for Node.js v0.11.x (or newer).
Just take a look on its pretty models and beautiful API. 
Uses [monk](https://github.com/Automattic/monk) under the hood.

## Features

- Based on ES6 generators, which means **no callbacks**
- Common, established API you've already used to
- Hooks (before:save, around:create, after:remove, etc)
- Very simple and easy-to-understand implementation
- Fully covered by tests

## Installation

```
npm install mongorito --save
```

**Warning**: You should have Node.js v0.11.x installed (or newer). Run node with `--harmony` option:

```
node --harmony something.js
```

**Note**: In order for the following examples to work, you need use something like [co](https://github.com/tj/co).

## Getting Started

```javascript
var Mongorito = require('mongorito');
var Model = Mongorito.Model;
```

#### Connect

```javascript
Mongorito.connect('localhost/database_name');
Mongorito.connect('db1/database_name', 'db2/database_name'); // replica set
```

#### Disconnect

```javascript
Mongorito.disconnect();
Mongorito.close(); // alias for disconnect
```

#### Define a model

That's right. No schema.

```javascript
var Post = Model.extend({
    collection: 'posts'
});
```

#### Find all

Returns all documents in the collection.

```javascript
var posts = yield Post.all();
```

#### Find with query

Always returns an array.

```javascript
var posts;

posts = yield Post.find(); // same as .all()

// match documents with title = "Great title"
posts = yield Post.find({ title: 'Great title' });
posts = yield Post.where('title', 'Great title').find();
posts = yield Post.where('title').equals('Great title').find();

// match documents with regex
posts = yield Post.where('title', /great/i).find();

// match documents matching sub-property
posts = yield Post.where('author.name', 'John Doe').find();

// match documents matching sub-documents
// matching posts where at least one comment.body is "Nice comment"
posts = yield Post.where('comments', { body: 'Nice comment' }).find();

// match documents with limit
posts = yield Post.limit(5).find();

// match documents with skip
posts = yield Post.skip(5).find();

// match documents where some field exists
posts = yield Post.where('title').exists().find();

// match documents with $in
posts = yield Post.where('title').in(['First title', 'Second title']).find();

// match documents with $gt, $gte, $lt, $lte
posts = yield Post.where('position').gt(5).find();
posts = yield Post.gt('position', 5).find();
```

#### Find and populate

Let's say you have such Post document:
```
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

And you need to fetch each Comment document from *comments* field:

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

With populating, you don't need to write all that and instead do this:

```javascript
// .populate() tells query to populate comments field
// with documents fetched using Comment model
var post = yield Post.populate('comments', Comment).findOne();
var comments = post.get('comments');

// comments is an array of Comment models now
```

**Note**: When you will try to save a document with populated fields, they will be reverted back to _id's.

#### Find one

Finds only one document. Returns either Model instance (Post, in these examples) or undefined.

```javascript
var post;

post = yield Post.findOne(); // returns first document in collection
post = yield Post.findOne({ title: 'Great title' });
```

#### Save

Automatically determines when to create or update a document based on **_id** field.

```javascript
var post = new Post({ // can pass fields directly to constructor
    title: 'Some title'
});

post.set('title', 'Good title'); // or using .set() method by passing key and value

post.set({ // or by passing object of fields
    title: 'Great title',
    body: 'Hot body'
});

yield post.save(); // document created

var id = post.get('_id'); // _id automatically had been set after .save()


post.set('title', 'Updated title');
yield post.save(); // document updated
```

#### Remove

```javascript
yield post.remove();
```

Or you can remove multiple documents using:

```javascript
yield Post.remove({ title: 'Some title' }); // query
```

### Hooks

Mongorito models support *before*, *create* and *around* (*before* + *create*) hooks for these events:

- save (executes on both create and update)
- create
- update
- remove

To setup a hook for some event:

```javascript
var Post = Model.extend({
   collection: 'posts',
   
   customHandling: function *(next) {
       // processing, validating, etc
       
       yield next; // MUST be present
   }.before('save')
});
```

Same goes for other hooks:

```javascript
myAfterCreateHook: function *(next) {
    // executes after document was created
    
    yield next;
}.after('create'),

myAroundRemoveHook: function *(next) {
    // executes before and after document was removed
    
    yield next;
}.around('remove')
```

If you want to break the chain and prevent executing of the next hooks, just throw an **Error**:

```javascript
myHook: function *(next) {
    throw new Error('Next hooks will not be executed');
}.before('update')
```

## Tests

To execute tests run:

```
npm test
```

## License

The MIT License (MIT)
Copyright © 2014 Vadim Demedes <vdemedes@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.