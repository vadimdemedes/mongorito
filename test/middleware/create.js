import {spy} from 'sinon';
import test from 'ava';
import createMiddleware from '../../lib/middleware/create';
import {create, call} from '../../lib/actions';
import {CREATED} from '../../lib/action-types';

test('ignore unrelated actions', t => {
	const next = spy(action => action);
	const middleware = createMiddleware({})(next);
	const ret = middleware({type: 'UNKNOWN'});

	t.true(next.calledOnce);
	t.deepEqual(ret, {type: 'UNKNOWN'});
});

test('dispatch call to create document', async t => {
	let dispatchCalls = 0;
	const dispatch = spy(action => {
		if (dispatchCalls++ === 0) {
			return Promise.resolve({
				ops: [{_id: 'a'}]
			});
		}

		return Promise.resolve(action);
	});

	const next = spy();
	const middleware = createMiddleware({dispatch})(next);
	const ret = await middleware(create({a: 'b'}));

	t.false(next.called);
	t.true(dispatch.calledTwice);
	t.deepEqual(dispatch.firstCall.args[0], call('insert', [{a: 'b'}]));
	t.deepEqual(dispatch.secondCall.args[0], {type: CREATED, id: 'a'});
	t.deepEqual(ret, dispatch.secondCall.args[0]);
});
