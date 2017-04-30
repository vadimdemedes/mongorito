import {spy} from 'sinon';
import test from 'ava';
import getMiddleware from '../../lib/middleware/get';
import {get} from '../../lib/actions';

test('ignore unrelated actions', t => {
	const next = spy(action => action);
	const middleware = getMiddleware({})(next);
	const ret = middleware({type: 'UNKNOWN'});

	t.true(next.calledOnce);
	t.deepEqual(ret, {type: 'UNKNOWN'});
});

test('get all fields', t => {
	const getState = () => ({
		fields: {a: 'b'}
	});

	const next = spy();
	const middleware = getMiddleware({getState})(next);
	const ret = middleware(get());

	t.false(next.called);
	t.deepEqual(ret, {a: 'b'});
});

test('get one field', t => {
	const getState = () => ({
		fields: {
			a: 'b',
			c: {d: 'e'}
		}
	});

	const next = spy();
	const middleware = getMiddleware({getState})(next);
	const a = middleware(get('a'));

	t.false(next.called);
	t.is(a, 'b');

	const d = middleware(get('c.d'));

	t.false(next.called);
	t.is(d, 'e');
});
