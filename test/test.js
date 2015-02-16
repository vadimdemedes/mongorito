require('babel/register')({
  blacklist: ['regenerator']
});

require('./mongorito.test');