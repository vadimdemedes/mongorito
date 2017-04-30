import {spy} from 'sinon';
import test from 'ava';
import refreshMiddleware from '../../lib/middleware/refresh';
import {refresh, query} from '../../lib/actions';
import {REFRESHED} from '../../lib/action-types';

test('ignore unrelated actions', t => {
	const next = spy(action => action);
	const middleware = refreshMiddleware({})(next);
	const ret = middleware({type: 'UNKNOWN'});

	t.true(next.calledOnce);
	t.deepEqual(ret, {type: 'UNKNOWN'});
});

test('dispatch calls to refresh a model', async t => {
	const getState = () => ({
		fields: {_id: 'a'}
	});

	let dispatchCalls = 0;
	const dispatch = spy(action => {
		if (dispatchCalls++ === 0) {
			return Promise.resolve({a: 'b'});
		}

		return Promise.resolve(action);
	});

	const next = spy();
	const middleware = refreshMiddleware({getState, dispatch})(next);
	const ret = await middleware(refresh());

	t.false(next.called);
	t.true(dispatch.calledTwice);
	t.deepEqual(dispatch.firstCall.args[0], query('findOne', [['where', {_id: 'a'}]]));
	t.deepEqual(dispatch.secondCall.args[0], {type: REFRESHED, fields: {a: 'b'}});
	t.deepEqual(ret, dispatch.secondCall.args[0]);
});
