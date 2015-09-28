SRC = $(wildcard src/*.js)

default:
	@echo "No default task"

test:
	@./node_modules/.bin/mocha --harmony test/mongorito.test

coverage:
	@node --harmony ./node_modules/istanbul-harmony/lib/cli cover --harmony ./node_modules/.bin/_mocha test/mongorito.test

include node_modules/make-lint/index.mk

clean:
	@rm -rf lib/*.js

.PHONY: test coverage clean

