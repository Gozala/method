/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true browser: true devel: true
         forin: true latedef: false globalstrict: true */
'use strict';

var Name = require('name')

// Shortcuts for ES5 reflection functions.
var create = Object.create
var defineProperty = Object.defineProperty

function Method(base) {
  /**
  Private Method is a callable private name that dispatches on the first
  arguments same named Method: Method(...rest) => rest[0][Method](...rest)
  Default implementation may be passed in as an argument.
  **/

  // Create an internal unique name if default implementation is passed,
  // use it's name as a name hint.
  var name = Name(base && base.name).toString()

  function dispatch() {
    // Method dispatches on type of the first argument.
    var target = arguments[0]
    // If first argument is `null` or `undefined` use associated property
    // maps for implementation lookups, otherwise use first argument itself.
    // Use default implementation lookup map if first argument does not
    // implements Method itself.
    var implementation = target === null ? Null[name] :
                         target === undefined ? Undefined[name] :
                         target[name] || Default[name]

    // If implementation not found there's not much we can do about it,
    // throw error with a descriptive message.
    if (!implementation)
      throw Error('Type does not implements Method')

    // If implementation is found delegate to it.
    return implementation.apply(implementation, arguments)
  }

  // Define default implementation.
  Default[name] = base

  // Define `Method.toString` returning private name, this hack will enable
  // Method definition like follows:
  // var foo = Method()
  // object[foo] = function() { /***/ }
  dispatch.toString = function() { return name }

  // Copy utility Methods for convenient API.
  dispatch.implement = implementMethod
  dispatch.define = defineMethod

  return dispatch
}

function implement(object, Method, implementation) {
  /**
  Implements `Method` for the given `object` with a provided `implementation`.
  Calling `Method` with `object` as a first argument will dispatch on provided
  implementation.
  **/
  var target = object === null ? Null :
               object === undefined ? Undefined :
               object

  return defineProperty(target, Method.toString(), { value: implementation })
}

function define(Type, Method, implementation) {
  /**
  Defines `Method` for the given `Type` with a provided `implementation`.
  Calling `Method` with a first argument of this `Type` will dispatch on
  provided `implementation`. If `Type` is a `Method` default implementation
  is defined. If `Type` is a `null` or `undefined` `Method` is implemented
  for that value type.
  **/
  return implement(Type && Type.prototype, Method, implementation)
}

Method.prototype = create(null, {
  toString: { value: Object.prototype.toString },
  valueOf: { value: Object.prototype.valueOf },
  define: { value: function(Type, implementation) {
    return define(Type, this, implementation)
  }},
  implement: { value: function(object, implementation) {
    return implement(object, this, implementation)
  }}
})

// Define objects where Methods implementations for `null`, `undefined` and 
// defaults will be stored. Note that we create these objects from `null`,
// otherwise implementation from `Object` would have being inherited. Also
// notice that `Default` implementations are stored on `Method.prototype` this
// provides convenient way for defining default implementations.
var Default = Method.prototype
var Null = create(Default)
var Undefined = create(Default)

// Create Method shortcuts as for a faster access.
var defineMethod = Default.define
var implementMethod = Default.implement

// Define exports on `Method` as it's only thing we export.
Method.implement = implement
Method.define = define
Method.Method = Method
Method.Null = Null
Method.Undefined = Undefined

module.exports = Method
