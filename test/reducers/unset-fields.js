import test from 'ava';
import {UPDATED} from '../../lib/action-types';
import {unset} from '../../lib/actions';
import reducer from '../../lib/reducers/unset-fields';

const macro = (t, prevState, action, nextState) => {
	t.deepEqual(reducer(prevState, action), nextState);
};

const t = (title, prevState, action, nextState) => {
	test(title, macro, prevState, action, nextState);
};

t('default state', undefined, {}, []);
t('add keys', ['a'], unset(['b']), ['a', 'b']);
t('reset', ['a'], {type: UPDATED}, []);
