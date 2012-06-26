/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true browser: true devel: true
         forin: true latedef: false */
/*global define: true, Cu: true, __URI__: true */
;(function(id, factory) { // Module boilerplate :(
  if (typeof(define) === 'function') { // RequireJS
    define(factory);
  } else if (typeof(require) === 'function') { // CommonJS
    factory.call(this, require, exports, module);
  } else if (String(this).indexOf('BackstagePass') >= 0) { // JSM
    factory(function require(uri) {
      var imports = {};
      this['Components'].utils.import(uri, imports);
      return imports;
    }, this, { uri: __URI__, id: id });
    this.EXPORTED_SYMBOLS = Object.keys(this);
  } else {  // Browser or alike
    var globals = this;
    factory(function require(id) {
      return globals[id];
    }, (globals[id] = {}), { uri: document.location.href + '#' + id, id: id });
  }
}).call(this, 'methods', function(require, exports, module) {

'use strict';

var Name = require('name')

// Shortcuts for ES5 reflection functions.
var create = Object.create
var defineProperty = Object.defineProperty

function Method(base) {
  /**
  Private method is a callable private name that dispatches on the first
  arguments same named method: method(...rest) => rest[0][method](...rest)
  Default implementation may be passed in as an argument.
  **/

  // Create an internal unique name if default implementation is passed,
  // use it's name as a name hint.
  var name = Name(base && base.name).toString()

  function method() {
    // Method dispatches on type of the first argument.
    var target = arguments[0]
    // If first argument is `null` or `undefined` use associated property
    // maps for implementation lookups, otherwise use first argument itself.
    // Use default implementation lookup map if first argument does not
    // implements method itself.
    var implementation = target === null ? Null[name] :
                         target === undefined ? Undefined[name] :
                         target[name] || Default[name]

    // If implementation not found there's not much we can do about it,
    // throw error with a descriptive message.
    if (!implementation)
      throw Error('Type does not implements method')

    // If implementation is found delegate to it.
    return implementation.apply(implementation, arguments)
  }

  // If default implementation was passed put it into default method lookup map.
  Default[name] = base

  // Define `method.toString` returning private name, this hack will enable
  // method definition like follows:
  // var method = Method()
  // object[method] = function() { /***/ }
  method.toString = function() { return name }

  // Define utility methods for implementing resulting method on different
  // types.
  method.extend = defineTypeMethod
  method.define = defineInstanceMethod

  return method
}
Method.prototype = create(null, {
  toString: { value: Object.prototype.toString },
  valueOf: { value: Object.prototype.valueOf },
  define: { value: function define(object, method) {
    /**
    defines `this` method on the given object. If object is `null` or `undefined`
    define method on associated implementation maps. If `object` is method itself
    than define default implementation.
    **/
    var target = object === null ? Null :
                 object === undefined ? Undefined :
                 object
    return defineProperty(target, this.toString(), { value: method })
  }},
  extend: { value: function extend(Type, method) {
    /**
    defines `this` method for the given Type. If `Type` is `this` method itself
    define default implementation. If `Type` is an object this is equivalent of
    `define`.
    **/
    return defineInstanceMethod.call(this, Type && Type.prototype, method)
  }}
})

// Define objects where methods implementations for `null`, `undefined` and 
// defaults will be stored. Note that we create these objects from `null`,
// otherwise implementation from `Object` would have being inherited. Also
// notice that `Default` implementations are stored on `Method.prototype` this
// provides convenient way for defining default implementations.
var Default = Method.prototype
var Null = create(Default)
var Undefined = create(Default)

// Define shortcuts as these properties are copied per each method.
var defineInstanceMethod = Default.define
var defineTypeMethod = Default.extend

module.exports = Method

});
