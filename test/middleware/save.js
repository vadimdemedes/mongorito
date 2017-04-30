import {spy} from 'sinon';
import test from 'ava';
import saveMiddleware from '../../lib/middleware/save';
import {save, update, create} from '../../lib/actions';

test('ignore unrelated actions', t => {
	const next = spy(action => action);
	const middleware = saveMiddleware({})(next);
	const ret = middleware({type: 'UNKNOWN'});

	t.true(next.calledOnce);
	t.deepEqual(ret, {type: 'UNKNOWN'});
});

test('create', t => {
	const getState = () => ({
		fields: {}
	});

	const dispatch = spy(action => action);
	const next = spy();
	const middleware = saveMiddleware({getState, dispatch})(next);
	const ret = middleware(save({a: 'b'}));

	t.false(next.called);
	t.true(dispatch.calledOnce);
	t.deepEqual(dispatch.firstCall.args[0], create({a: 'b'}));
	t.deepEqual(ret, dispatch.firstCall.args[0]);
});

test('update', t => {
	const getState = () => ({
		fields: {_id: 'a'}
	});

	const dispatch = spy(action => action);
	const next = spy();
	const middleware = saveMiddleware({getState, dispatch})(next);
	const ret = middleware(save({a: 'b'}));

	t.false(next.called);
	t.true(dispatch.calledOnce);
	t.deepEqual(dispatch.firstCall.args[0], update({a: 'b'}));
	t.deepEqual(ret, dispatch.firstCall.args[0]);
});
