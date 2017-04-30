const {Database, Model, ObjectId, ActionTypes} = require('./');
const fieldsReducer = require('./lib/reducers/fields');

const db = new Database('localhost/mongorito_test');

class Post extends Model {}
class Comment extends Model {}
class User extends Model {}

// Post.embeds('comments', Comment);
// Post.embeds('author', User);
// Comment.embeds('user', User);

db.register(Post);
db.register(Comment);
db.register(User);

db.connect()
	.then(async () => {
		const post = new Post({
			title: 'Shit',
			author: {name: 'Paul'}
			// comments: [
			// 	new Comment({user: new User({name: 'John'}), body: 'Wow'})
			// ],
			// author: new User({name: 'Paul'})
		});

		await post.save();
		console.log(post.get());
		post.set('author.rating', 1);
		post.unset('author.name');
		await post.save();
		console.log(post.get());
		// console.log(post.get());
		// post.set('author', 'Fucker');
		// await post.save();
		// console.log(post.get());
		// await post.remove();
		// console.log(post.get());
	})
	.catch(err => {
		console.log(err.stack);
	})
	.then(() => db.disconnect());
