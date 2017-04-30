import {spy} from 'sinon';
import test from 'ava';
import removeMiddleware from '../../lib/middleware/remove';
import {remove, call} from '../../lib/actions';
import {REMOVED} from '../../lib/action-types';

test('ignore unrelated actions', t => {
	const next = spy(action => action);
	const middleware = removeMiddleware({})(next);
	const ret = next({type: 'UNKNOWN'});

	t.true(next.calledOnce);
	t.deepEqual(ret, {type: 'UNKNOWN'});
});

test('dispatch a call to remove document', async t => {
	const getState = () => ({
		fields: {_id: 'a'}
	});

	const dispatch = spy(action => Promise.resolve(action));
	const next = spy();
	const middleware = removeMiddleware({getState, dispatch})(next);
	const ret = await middleware(remove());

	t.false(next.called);
	t.true(dispatch.calledTwice);
	t.deepEqual(dispatch.firstCall.args[0], call('remove', [{_id: 'a'}]));
	t.deepEqual(dispatch.secondCall.args[0], {type: REMOVED});
	t.deepEqual(ret, dispatch.secondCall.args[0]);
});
