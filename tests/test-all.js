/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true browser: true devel: true
         forin: true latedef: false */
/*global define: true, Cu: true, __URI__: true */
;(function(id, factory) { // Module boilerplate :(
  if (typeof(define) === 'function') { // RequireJS
    define(factory);
  } else if (typeof(require) === 'function') { // CommonJS
    factory.call(this, require, exports, module);
  } else if (~String(this).indexOf('BackstagePass')) { // JSM
    factory(function require(uri) {
      var imports = {};
      Cu.import(uri, imports);
      return imports;
    }, this, { uri: __URI__, id: id });
    this.EXPORTED_SYMBOLS = Object.keys(this);
  } else {  // Browser or alike
    var globals = this
    factory(function require(id) {
      return globals[id];
    }, (globals[id] = {}), { uri: document.location.href + '#' + id, id: id });
  }
}).call(this, 'test/test-all', function(require, exports, module) {

'use strict';

var Method = require('../core')

function type(value) {
  return Object.prototype.toString.call(value).
    split(' ').
    pop().
    split(']').
    shift().
    toLowerCase()
}

var values = [
  null,                   // 0
  undefined,              // 1
  Infinity,               // 2
  NaN,                    // 3
  5,                      // 4
  {},                     // 5
  Object.create({}),      // 6
  Object.create(null),    // 7
  [],                     // 8
  /foo/,                  // 9
  new Date(),             // 10
  Function,               // 11
  function() {},          // 12
  true,                   // 13
  false,                  // 14
  "string"                // 15
]

function True() { return true }
function False() { return false }

var trues = values.map(True)
var falses = values.map(False)

exports['test throws if not implemented'] = function(assert) {
  var method = Method()

  assert.throws(function() {
    method({})
  }, /not implement/i, 'method throws if not implemented')

  assert.throws(function() {
    method(null)
  }, /not implement/i, 'method throws on null')
}

exports['test all types inherit from default'] = function(assert) {
  var isImplemented = Method(function() { return true })

  values.forEach(function(value) {
    assert.ok(isImplemented(value),
              type(value) + ' inherits deafult implementation')
  })
}

exports['test default can be implemented later'] = function(assert) {
  var isImplemented = Method()
  isImplemented.define(Method, function() {
    return true
  })

  values.forEach(function(value) {
    assert.ok(isImplemented(value),
              type(value) + ' inherits deafult implementation')
  })
}

exports['-test method for Object'] = function(assert) {
  var isObject = Method()
  var expected = trues.slice()
  isObject.define(Object, function() { return true })

  assert.throws(function() {
    isObject(null)
  }, /not implement/i, 'not implemented for null')
  assert.throws(function() {
     isObject(undefined)
  }, /not implement/i, 'not implemented for undefined')

  isObject.define(Method, function() { return false })
  expected = [ false, false ].concat(expected.slice(2))

  assert.deepEqual(values.map(isObject),
                   expected,
                  'null and undefined inherits default implementation ' +
                  'rest from Object')

  isObject.define(Function, function() { return false })
  expected = expected.slice(0, 11).concat(false, false).concat(expected.slice(13))

  assert.deepEqual(values.map(isObject), expected, 'functions inherit' +
                   'implementations from functions');
}

exports['test dispatch not-implemented'] = function(assert) {
  var isDefault = Method()
  values.forEach(function(value) {
    assert.throws(function() {
      isDefault(value)
    }, /not implement/, type(value) + ' throws if not implemented')
  })
}

exports['test dispatch default'] = function(assert) {
  var isDefault = Method()

  // Implement default
  isDefault.define(Method, True)
  assert.deepEqual(values.map(isDefault), trues,
                   'all implementation inherit from default')

}

exports['test dispatch null'] = function(assert) {
  var isNull = Method()

  // Implement default
  isNull.define(Method, False)
  isNull.define(null, True)
  assert.deepEqual(values.map(isNull),
                   [ true ].
                   concat(falses.slice(1)),
                   'only null gets methods defined for null')
}

exports['test dispatch undefined'] = function(assert) {
  var isUndefined = Method()

  // Implement default
  isUndefined.define(Method, False)
  isUndefined.define(undefined, True)
  assert.deepEqual(values.map(isUndefined),
                   [ false, true ].
                   concat(falses.slice(2)),
                   'only undefined gets methods defined for undefined')
}

exports['test dispatch object'] = function(assert) {
  var isObject = Method()

  // Implement default
  isObject.define(Method, False)
  isObject.define(Object, True)
  assert.deepEqual(values.map(isObject),
                   [ false, false ].
                   concat(trues.slice(2, 7)).
                   concat(false).
                   concat(trues.slice(8)),
                   'all values except null, undefined, Object.create(null) ' +
                   'inherit from Object')

}

exports['test dispatch number'] = function(assert) {
  var isNumber = Method()
  isNumber.define(Method, False)
  isNumber.define(Number, True)

  assert.deepEqual(values.map(isNumber),
                  falses.slice(0, 2).
                  concat(true, true, true).
                  concat(falses.slice(5)),
                  'all numbers inherit from Number method')
}

exports['test dispatch string'] = function(assert) {
  var isString = Method()
  isString.define(Method, False)
  isString.define(String, True)

  assert.deepEqual(values.map(isString),
                  falses.slice(0, 15).
                  concat(true),
                  'all strings inherit from String method')
}

exports['test dispatch function'] = function(assert) {
  var isFunction = Method()
  isFunction.define(Method, False)
  isFunction.define(Function, True)

  assert.deepEqual(values.map(isFunction),
                  falses.slice(0, 11).
                  concat(true, true).
                  concat(falses.slice(13)),
                  'all functions inherit from Function method')
}


exports['test dispatch date'] = function(assert) {
  var isDate = Method()
  isDate.define(Method, False)
  isDate.define(Date, True)

  assert.deepEqual(values.map(isDate),
                  falses.slice(0, 10).
                  concat(true).
                  concat(falses.slice(11)),
                  'all dates inherit from Date method')
}


exports['test dispatch RegExp'] = function(assert) {
  var isRegExp = Method()
  isRegExp.define(Method, False)
  isRegExp.define(RegExp, True)

  assert.deepEqual(values.map(isRegExp),
                  falses.slice(0, 9).
                  concat(true).
                  concat(falses.slice(10)),
                  'all regexps inherit from RegExp method')
}


exports['test inline implementation'] = function(assert) {
  var isFoo = Method(function() { return false })

  var foo = {}
  assert.ok(!isFoo(foo), 'object inherits default implementation')

  isFoo.implement(foo, function() { return true })
  assert.ok(isFoo(foo), 'object can be extended with an implementation')

  assert.ok(isFoo.implement(Object.create(null), function() { return true }),
    'null prototyped objects can also have inline implementations')
}

if (require.main === module) require('test').run(exports)

});
