import test from 'ava';
import ActionTypes from '../lib/action-types';
import Actions from '../lib/actions';

const macro = (t, actual, expected) => {
	t.deepEqual(actual, expected);
};

const t = (title, actual, expected) => {
	test(title, macro, actual, expected);
};

t('get', Actions.get('a'), {
	type: ActionTypes.GET,
	key: 'a'
});

t('set', Actions.set({a: 'b'}), {
	type: ActionTypes.SET,
	fields: {a: 'b'}
});

t('unset', Actions.unset(['a']), {
	type: ActionTypes.UNSET,
	keys: ['a']
});

t('refresh', Actions.refresh(), {type: ActionTypes.REFRESH});

t('create', Actions.create({a: 'b'}), {
	type: ActionTypes.CREATE,
	fields: {a: 'b'}
});

t('update', Actions.update({a: 'b'}), {
	type: ActionTypes.UPDATE,
	fields: {a: 'b'}
});

t('save', Actions.save({a: 'b'}), {
	type: ActionTypes.SAVE,
	fields: {a: 'b'}
});

t('remove', Actions.remove(), {type: ActionTypes.REMOVE});

t('increment', Actions.increment({a: 1}), {
	type: ActionTypes.INCREMENT,
	fields: {a: 1}
});

t('create index', Actions.createIndex(['a']), {
	type: ActionTypes.CREATE_INDEX,
	args: ['a']
});

t('drop index', Actions.dropIndex(['a']), {
	type: ActionTypes.DROP_INDEX,
	args: ['a']
});

t('list indexes', Actions.listIndexes(['a']), {
	type: ActionTypes.LIST_INDEXES,
	args: ['a']
});

t('query', Actions.query('find', {a: 'b'}), {
	type: ActionTypes.QUERY,
	method: 'find',
	query: {a: 'b'}
});

t('call', Actions.call('find', ['a']), {
	type: ActionTypes.CALL,
	method: 'find',
	args: ['a']
});
