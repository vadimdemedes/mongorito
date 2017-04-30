import {spy} from 'sinon';
import test from 'ava';
import createIndexMiddleware from '../../lib/middleware/create-index';
import {createIndex, call} from '../../lib/actions';

test('ignore unrelated actions', t => {
	const next = spy(action => action);
	const middleware = createIndexMiddleware({})(next);
	const ret = middleware({type: 'UNKNOWN'});

	t.true(next.calledOnce);
	t.deepEqual(ret, {type: 'UNKNOWN'});
});

test('dispatch call to create index', t => {
	const dispatch = spy(action => action);
	const next = spy();
	const middleware = createIndexMiddleware({dispatch})(next);
	const ret = middleware(createIndex(['a', 'b']));

	t.false(next.called);
	t.true(dispatch.calledOnce);
	t.deepEqual(dispatch.firstCall.args[0], call('createIndex', ['a', 'b']));
	t.deepEqual(ret, dispatch.firstCall.args[0]);
});
