import {spy} from 'sinon';
import test from 'ava';
import updateMiddleware from '../../lib/middleware/update';
import {update, call} from '../../lib/actions';
import {UPDATED} from '../../lib/action-types';

test('ignore unrelated actions', t => {
	const next = spy(action => action);
	const middleware = updateMiddleware({})(next);
	const ret = middleware({type: 'UNKNOWN'});

	t.true(next.calledOnce);
	t.deepEqual(ret, {type: 'UNKNOWN'});
});

test('update', async t => {
	const getState = () => ({
		unset: [],
		fields: {_id: 'a'}
	});

	const dispatch = spy(action => Promise.resolve(action));
	const next = spy();
	const middleware = updateMiddleware({getState, dispatch})(next);
	const ret = await middleware(update({a: 'b'}));

	t.false(next.called);
	t.true(dispatch.calledTwice);
	t.deepEqual(dispatch.firstCall.args[0], call('update', [
		{_id: 'a'},
		{$set: {a: 'b'}
	}]));

	t.deepEqual(dispatch.secondCall.args[0], {
		type: UPDATED,
		fields: {a: 'b'}
	});

	t.deepEqual(ret, dispatch.secondCall.args[0]);
});

test('unset', async t => {
	const getState = () => ({
		unset: ['a', 'b'],
		fields: {_id: 'a'}
	});

	const dispatch = spy(action => Promise.resolve(action));
	const next = spy();
	const middleware = updateMiddleware({getState, dispatch})(next);
	const ret = await middleware(update({}));

	t.false(next.called);
	t.true(dispatch.calledThrice);
	t.deepEqual(dispatch.firstCall.args[0], call('update', [
		{_id: 'a'},
		{$unset: {a: '', b: ''}
	}]));

	t.deepEqual(dispatch.secondCall.args[0], call('update', [
		{_id: 'a'},
		{$set: {}}
	]));

	t.deepEqual(dispatch.thirdCall.args[0], {
		type: UPDATED,
		fields: {}
	});

	t.deepEqual(ret, dispatch.thirdCall.args[0]);
});

test('update and unset', async t => {
	const getState = () => ({
		unset: ['a', 'b'],
		fields: {_id: 'a'}
	});

	const dispatch = spy(action => Promise.resolve(action));
	const next = spy();
	const middleware = updateMiddleware({getState, dispatch})(next);
	const ret = await middleware(update({c: 'd'}));

	t.false(next.called);
	t.true(dispatch.calledThrice);
	t.deepEqual(dispatch.firstCall.args[0], call('update', [
		{_id: 'a'},
		{$unset: {a: '', b: ''}
	}]));

	t.deepEqual(dispatch.secondCall.args[0], call('update', [
		{_id: 'a'},
		{$set: {c: 'd'}}
	]));

	t.deepEqual(dispatch.thirdCall.args[0], {
		type: UPDATED,
		fields: {c: 'd'}
	});

	t.deepEqual(ret, dispatch.thirdCall.args[0]);
});
