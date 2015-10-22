default:
	@echo "No default task"

test:
	@./node_modules/.bin/mocha --harmony test/mongorito.test

coverage:
	@node --harmony ./node_modules/istanbul-harmony/lib/cli cover --harmony ./node_modules/.bin/_mocha test/mongorito.test

lint:
	@./node_modules/.bin/xo

.PHONY: test coverage lint
