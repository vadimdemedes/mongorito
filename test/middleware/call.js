import {spy} from 'sinon';
import test from 'ava';
import callMiddleware from '../../lib/middleware/call';
import {call} from '../../lib/actions';

test('ignore unrelated actions', t => {
	const next = spy(action => action);
	const middleware = callMiddleware({})(next);
	const ret = middleware({type: 'UNKNOWN'});

	t.true(next.calledOnce);
	t.deepEqual(ret, {type: 'UNKNOWN'});
});

test('call method on collection', async t => {
	const collection = {
		find: spy((a, b) => Promise.resolve([a, b]))
	};

	const modelClass = {
		getCollection() {
			return Promise.resolve(collection);
		}
	};

	const next = spy();
	const middleware = callMiddleware({modelClass})(next);
	const ret = await middleware(call('find', ['a', 'b']));

	t.false(next.called);
	t.true(collection.find.calledOnce);
	t.deepEqual(collection.find.firstCall.args, ['a', 'b']);
	t.deepEqual(ret, ['a', 'b']);
});
