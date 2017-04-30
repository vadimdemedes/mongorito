import {spy} from 'sinon';
import test from 'ava';
import incrementMiddleware from '../../lib/middleware/increment';
import {increment, refresh, call} from '../../lib/actions';

test('ignore unrelated actions', t => {
	const next = spy(action => action);
	const middleware = incrementMiddleware({})(next);
	const ret = middleware({type: 'UNKNOWN'});

	t.true(next.calledOnce);
	t.deepEqual(ret, {type: 'UNKNOWN'});
});

test('dispatch call to increment', async t => {
	const getState = () => ({
		fields: {_id: 'a'}
	});

	const dispatch = spy(action => Promise.resolve(action));
	const next = spy();
	const middleware = incrementMiddleware({getState, dispatch})(next);
	const ret = await middleware(increment({a: 1}));

	t.false(next.called);
	t.true(dispatch.calledTwice);

	const query = {_id: 'a'};
	const options = {$inc: {a: 1}};
	t.deepEqual(dispatch.firstCall.args[0], call('update', [query, options]));
	t.deepEqual(dispatch.secondCall.args[0], refresh());
	t.deepEqual(ret, dispatch.secondCall.args[0]);
});
