SRC = $(wildcard src/*.js)
LIB = $(SRC:src/%.js=lib/%.js)

lib: $(LIB)
lib/%.js: src/%.js
	@mkdir -p $(@D)
	./node_modules/.bin/babel $< -L all -b regenerator,es6.constants -o $@

test:
	@./node_modules/.bin/mocha --harmony test/test.js

coverage:
	@node --harmony ./node_modules/istanbul-harmony/lib/cli cover --harmony ./node_modules/.bin/_mocha test/test

include node_modules/make-lint/index.mk

clean:
	@rm -rf lib/*.js

.PHONY: test coverage clean

