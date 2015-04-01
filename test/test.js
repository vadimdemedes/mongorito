require('babel/register')({
  blacklist: ['regenerator', 'es6.constants']
});

require('./mongorito.test');
