import {spy} from 'sinon';
import test from 'ava';
import dropIndexMiddleware from '../../lib/middleware/drop-index';
import {dropIndex, call} from '../../lib/actions';

test('ignore unrelated actions', t => {
	const next = spy(action => action);
	const middleware = dropIndexMiddleware({})(next);
	const ret = middleware({type: 'UNKNOWN'});

	t.true(next.calledOnce);
	t.deepEqual(ret, {type: 'UNKNOWN'});
});

test('dispatch call to drop index', t => {
	const dispatch = spy();
	const next = spy();
	const middleware = dropIndexMiddleware({dispatch})(next);
 	const ret = middleware(dropIndex(['a', 'b']));

	t.false(next.called);
	t.true(dispatch.calledOnce);
	t.deepEqual(dispatch.firstCall.args[0], call('dropIndex', ['a', 'b']));
});
