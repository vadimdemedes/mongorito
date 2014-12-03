# Mongorito

Awesome ES6 generator-based MongoDB ODM for Node.js v0.11.x (or newer).
Just take a look on its pretty models and beautiful API. 
Uses [monk](https://github.com/Automattic/monk) under the hood.

![NPM stats](https://nodei.co/npm/mongorito.png?downloads=true)

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

## Overview

```javascript
var Mongorito = require('mongorito');
var Model = Mongorito.Model;

// connect to localhost/blog
Mongorito.connect('localhost/blog');


// define model
var Post = Model.extend({
    collection: 'posts'
});


// create new Post document
var post = new Post({
    title: 'Node.js with --harmony rocks!',
    body: 'Long post body',
    author: {
        name: 'John Doe'
    }
});


// create
yield post.save();


// update document
post.set('title', 'Post got a new title!');
post.set('author.name', 'Doe John');


// update
yield post.save();


// find some posts
var posts;

// find posts where body equals "Long post body"
posts = yield Post.where('body', 'Long post body').find();

// find posts where author's name equals "John Doe"
posts = yield Post.where('author.name', 'John Doe').find();

// Bonus: find posts where title starts with "Node"
posts = yield Post.where('title', /^node/i).find();


// disconnect
Mongorito.disconnect();
```

## Getting Started

Check out [Getting Started](http://mongorito.com/guides/getting-started) guide on [http://mongorito.com](http://mongorito.com).

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