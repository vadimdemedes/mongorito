# Mongorito

[![Build Status](https://travis-ci.org/vdemedes/mongorito.svg?branch=master)](https://travis-ci.org/vdemedes/mongorito) [![Coverage Status](https://coveralls.io/repos/vdemedes/mongorito/badge.svg?branch=master&service=github)](https://coveralls.io/github/vdemedes/mongorito?branch=master)

Awesome ES6 generator-based MongoDB ODM for Node.js v4.x (or newer).
Just take a look on its pretty models and beautiful API.
Uses official [mongodb](https://www.npmjs.com/package/mongodb) driver under the hood.

<h1 align="center">
  <br>
  <img width="200" src="media/logo.png">
  <br>
  <br>
</h1>


## Features

- Based on ES6 generators, which means **no callbacks**
- Established API you've already used to
- Hooks (before:save, around:create, after:remove, etc)
- Very simple and easy-to-understand implementation
- Fully covered by tests
- Using this module results in a beautiful code


## Installation

```
$ npm install mongorito --save
```

**Note**: In order for the following examples to work, you need to use [co](https://github.com/tj/co) to run generators.


## Usage

```js
const Mongorito = require('mongorito');
const Model = Mongorito.Model;

// connect to localhost/blog
yield Mongorito.connect('localhost/blog');


// define model
class Post extends Model {

}


// create and save new Post document
let post = new Post({
    title: 'Node.js with --harmony rocks!',
    body: 'Long post body',
    author: {
        name: 'John Doe'
    }
});

yield post.save();


// update document
post.set('title', 'Post got a new title!');
post.set('author.name', 'Doe John');

yield post.save();

// find posts where body equals "Long post body"
let posts = yield Post.where('body', 'Long post body').find();

// find posts where author's name equals "John Doe"
posts = yield Post.where('author.name', 'John Doe').find();

// Bonus: find posts where title starts with "Node"
posts = yield Post.where('title', /^node/i).find();
```


## API

Check out [Getting Started](http://mongorito.com/guides/getting-started) guide on [http://mongorito.com](http://mongorito.com).
There are more guides available to learn more.


## Tests

```
$ npm test
```


## License

Mongorito is released under the MIT License.
