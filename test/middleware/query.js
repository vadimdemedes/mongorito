import {spy} from 'sinon';
import test from 'ava';
import queryMiddleware from '../../lib/middleware/query';
import {query} from '../../lib/actions';

test('ignore unrelated actions', t => {
	const next = spy(action => action);
	const middleware = queryMiddleware({})(next);
	const ret = middleware({type: 'UNKNOWN'});

	t.true(next.calledOnce);
	t.deepEqual(ret, {type: 'UNKNOWN'});
});

test('query collection', async t => {
	const collection = {
		find: spy((match, options, cb) => {
			const cursor = {
				toArray(cb) {
					cb(null, ['a', 'b']);
				}
			};

			cb(null, cursor);
		})
	};

	const modelClass = {
		getCollection() {
			return Promise.resolve(collection);
		}
	};

	const next = spy();
	const middleware = queryMiddleware({modelClass})(next);
	const ret = await middleware(query('find', [
		['where', {a: 'b'}],
		['limit', 5]
	]));

	t.false(next.called);
	t.true(collection.find.calledOnce);

	const callArgs = collection.find.firstCall.args;
	t.deepEqual(callArgs[0], {a: 'b'});
	t.deepEqual(callArgs[1], {limit: 5, fields: undefined});

	t.deepEqual(ret, ['a', 'b']);
});
