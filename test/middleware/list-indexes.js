import {spy} from 'sinon';
import test from 'ava';
import listIndexesMiddleware from '../../lib/middleware/list-indexes';
import {listIndexes, call} from '../../lib/actions';

test('ignore unrelated actions', t => {
	const next = spy(action => action);
	const middleware = listIndexesMiddleware({})(next);
	const ret = middleware({type: 'UNKNOWN'});

	t.true(next.calledOnce);
	t.deepEqual(ret, {type: 'UNKNOWN'});
});

test('dispatch call to list indexes', async t => {
	const dispatch = spy(() => {
		return Promise.resolve({
			toArray() {
				return ['a', 'b'];
			}
		});
	});

	const next = spy();
	const middleware = listIndexesMiddleware({dispatch})(next);
	const ret = await middleware(listIndexes(['a', 'b']));

	t.false(next.called);
	t.true(dispatch.calledOnce);
	t.deepEqual(dispatch.firstCall.args[0], call('listIndexes', ['a', 'b']));
	t.deepEqual(ret, ['a', 'b']);
});
