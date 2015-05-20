/**
 * Functions from Babel
 */

"use strict";

var _prototypeProperties = function _prototypeProperties(child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var _inherits = function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) subClass.__proto__ = superClass;
};

var _classCallCheck = function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

/**
 * Expose extend
 */

module.exports = extend;

/**
 * Extend
 */

function extend(Model) {
  return function (instanceProps, staticProps) {
    console.error("MONGORITO  Model.extend() function is deprecated and will be removed really, really soon. Please, use ES6 classes to define your models (example on https://github.com/vdemedes/mongorito).");

    var klass = function klass() {
      _classCallCheck(this, klass);

      Model.apply(this, arguments);
    };

    _inherits(klass, Model);
    _prototypeProperties(klass, toProperties(staticProps), toProperties(instanceProps));

    return klass;
  };
};

/**
 * Utilities
 */

// convert object to ES6 Object.defineProperties argument
function toProperties(obj) {
  if (!obj) return null;

  var props = Object.create(null);

  Object.keys(obj).forEach(function (key) {
    props[key] = {
      value: obj[key],
      configurable: true
    };
  });

  return props;
}
