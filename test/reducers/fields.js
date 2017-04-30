import test from 'ava';
import {CREATED, REMOVED, REFRESHED} from '../../lib/action-types';
import {set, unset} from '../../lib/actions';
import reducer from '../../lib/reducers/fields';

const macro = (t, prevState, action, nextState) => {
	t.deepEqual(reducer(prevState, action), nextState);
};

const t = (title, prevState, action, nextState) => {
	test(title, macro, prevState, action, nextState);
};

t('default state', undefined, {}, {});

t('set', {
	a: {b: 1}
}, set({
	a: {c: 2},
	d: 1
}), {
	a: {b: 1, c: 2},
	d: 1
});

t('unset', {a: 1, b: 2}, unset(['b']), {a: 1});
t('assign id', {a: 1}, {type: CREATED, id: 2}, {a: 1, _id: 2});
t('remove id', {a: 1, _id: 2}, {type: REMOVED}, {a: 1});
t('refresh', {a: 1}, {type: REFRESHED, fields: {b: 2}}, {b: 2});
