# Mongorito

ES6 generator-based MongoDB ODM for Node.js v0.11.x.

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

```
var posts;

posts = yield Post.find(); // same as .all()
posts = yield Post.find({ title: 'Great title' });
```

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