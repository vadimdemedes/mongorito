import test from 'ava';
import createStore from '../lib/create-store';

test('default state', t => {
	const model = {};
	const modelClass = {};
	const store = createStore({model, modelClass});

	t.deepEqual(store.getState(), {
		unset: [],
		fields: {}
	});
});

test('expose model and class', t => {
	const testMiddleware = ({model, modelClass}) => () => () => {
		return {model, modelClass};
	};

	const model = {};
	const modelClass = {middleware: [testMiddleware]};
	const store = createStore({model, modelClass});
	const ret = store.dispatch({});

	t.is(ret.model, model);
	t.is(ret.modelClass, modelClass);
});

test('add custom reducers', t => {
	const testReducer = (state = false, action) => {
		switch (action.type) {
			case 'TOGGLE': return !state;
			default: return state;
		}
	};

	const modifyReducer = reducer => ({
		...reducer,
		test: testReducer
	});

	const model = {};
	const modelClass = {customReducers: [modifyReducer]};
	const store = createStore({model, modelClass});

	t.deepEqual(store.getState(), {
		unset: [],
		fields: {},
		test: false
	});

	store.dispatch({type: 'TOGGLE'});

	t.deepEqual(store.getState(), {
		unset: [],
		fields: {},
		test: true
	});
});
