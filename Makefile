default:
	@echo "No default task"

test:
	@./node_modules/.bin/mocha --harmony test/mongorito.test

coverage:
	@./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha --harmony test/mongorito.test

lint:
	@./node_modules/.bin/xo

.PHONY: test coverage lint
