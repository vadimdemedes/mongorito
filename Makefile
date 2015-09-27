SRC = $(wildcard src/*.js)

default:
	@echo "No default task"

test:
	@./node_modules/.bin/mocha --harmony test/test.js

coverage:
	@node --harmony ./node_modules/istanbul-harmony/lib/cli cover --harmony ./node_modules/.bin/_mocha test/test

include node_modules/make-lint/index.mk

clean:
	@rm -rf lib/*.js

.PHONY: test coverage clean

