import {spy} from 'sinon';
import test from 'ava';
import setMiddleware from '../../lib/middleware/set';
import {set} from '../../lib/actions';

class Model {
	constructor(fields) {
		this.fields = fields;
	}
}

test('ignore unrelated actions', t => {
	const modelClass = {};
	const next = spy(action => action);
	const middleware = setMiddleware({modelClass})(next);
	const ret = middleware({type: 'UNKNOWN'});

	t.true(next.calledOnce);
	t.deepEqual(ret, {type: 'UNKNOWN'});
});

test('ignore set without embedded models', t => {
	const modelClass = {};
	const next = spy(action => action);
	const middleware = setMiddleware({modelClass})(next);
	const ret = middleware(set({a: 'b'}));

	t.true(next.calledOnce);
	t.deepEqual(next.firstCall.args[0], set({a: 'b'}));
	t.deepEqual(ret, next.firstCall.args[0]);
});

test('embed single model', t => {
	const modelClass = {
		embeddedModels: [
			{key: 'b', model: Model},
			{key: 'e', model: Model}
		]
	};

	const next = spy(action => action);
	const middleware = setMiddleware({modelClass})(next);
	const ret = middleware(set({
		a: 'b',
		b: {c: 'd'},
		e: new Model({f: 'g'})
	}));

	t.true(next.calledOnce);
	t.deepEqual(next.firstCall.args[0], set({
		a: 'b',
		b: new Model({c: 'd'}),
		e: new Model({f: 'g'})
	}));
});

test('embed multiple models', t => {
	const modelClass = {
		embeddedModels: [
			{key: 'b', model: Model},
			{key: 'e', model: Model}
		]
	};

	const next = spy(action => action);
	const middleware = setMiddleware({modelClass})(next);
	const ret = middleware(set({
		a: 'b',
		b: [{c: 'd'}, {f: 'g'}],
		e: [new Model({h: 'j'}), new Model({k: 'l'})]
	}));

	t.true(next.calledOnce);
	t.deepEqual(next.firstCall.args[0], set({
		a: 'b',
		b: [new Model({c: 'd'}), new Model({f: 'g'})],
		e: [new Model({h: 'j'}), new Model({k: 'l'})]
	}));
});
