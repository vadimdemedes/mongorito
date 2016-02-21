const jsome = require('jsome');
jsome.level.start = 2;

function example (desc, ev, fn) {
	console.log('  ' + desc);
	console.log();

	var code = fn.toString().split('\n');
	code = code.splice(1, code.length - 2);

	code.forEach(function (line, index) {
		console.log('  ', index + ' |', line.trim());
		console.log();
		jsome(ev(line));
	});
}

module.exports = example;
