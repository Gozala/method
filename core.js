/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true browser: true devel: true
         forin: true latedef: false globalstrict: true */
'use strict';

// Shortcuts for ES5 reflection functions.
var make = Object.create || (function() {
  var Type = function Type() {}
  return function make(prototype) {
    Type.prototype = prototype
    return new Type()
  }
})
var defineProperty = Object.defineProperty || function(object, name, property) {
  object[name] = property.value
  return object
}
var objectToString = Object.prototype.toString

function Method(base) {
  /**
  Private Method is a callable private name that dispatches on the first
  arguments same named Method: Method(...rest) => rest[0][Method](...rest)
  Default implementation may be passed in as an argument.
  **/

  // Create an internal unique name if default implementation is passed,
  // use it's name as a name hint.
  var name = (base && base.name || "") + Math.random().toString(32).substr(2)

  function dispatch() {
    // Method dispatches on type of the first argument.
    var target = arguments[0]
    var builtin = null
    // If first argument is `null` or `undefined` use associated property
    // maps for implementation lookups, otherwise attempt to use implementation
    // for built-in falling back for implementation on the first argument.
    // Finally use default implementation if no other one is found.
    var implementation = target === null ? Null[name] :
                         target === undefined ? Undefined[name] :
                         target[name] ||
                         ((builtin = Builtins[objectToString.call(target)]) &&
                          builtin[name]) ||
                         Builtins.Object[name] ||
                         Default[name]

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

// Define objects where Methods implementations for `null`, `undefined` and
// defaults will be stored.
var Default = {}
var Null = make(Default)
var Undefined = make(Default)
// Implementation for built-in types are stored in the hash, this avoids
// mutations on built-ins and allows cross frame extensions. Primitive types
// are predefined so that `Object` extensions won't be inherited.
var Builtins = {
  Object: make(Default),
  Number: make(Default),
  String: make(Default),
  Boolean: make(Default)
}
// Define aliases for predefined built-in maps to a forms that values will
// be serialized on dispatch.
Builtins[objectToString.call(Object.prototype)] = Builtins.Object
Builtins[objectToString.call(Number.prototype)] = Builtins.Number
Builtins[objectToString.call(String.prototype)] = Builtins.String
function implement(method, object, lambda) {
  /**
  Implements `Method` for the given `object` with a provided `implementation`.
  Calling `Method` with `object` as a first argument will dispatch on provided
  implementation.
  **/
  var target = object === null ? Null :
               object === undefined ? Undefined :
               object

  return defineProperty(target, method.toString(), {
    enumerable: false,
    configurable: false,
    writable: false,
    value: lambda
  })
}

function define(method, Type, lambda) {
  /**
  Defines `Method` for the given `Type` with a provided `implementation`.
  Calling `Method` with a first argument of this `Type` will dispatch on
  provided `implementation`. If `Type` is a `Method` default implementation
  is defined. If `Type` is a `null` or `undefined` `Method` is implemented
  for that value type.
  **/
  if (!Type) return implement(method, Type, lambda)
  var type = objectToString.call(Type.prototype)
  return type !== "[object Object]" ? implement(method, Type.prototype, lambda) :
    // This should be `Type === Object` but since it will be `false` for
    // `Object` from different JS context / compartment / frame we assume that
    // if it's name is `Object` it is Object.
    Type.name === "Object" ? implement(method, Builtins.Object, lambda) :
    implement(method,
              Builtins[type] || (Builtins[type] = make(Builtins.Object)),
              lambda)
}

var defineMethod = function defineMethod(Type, lambda) {
  return define(this, Type, lambda)
}
var implementMethod = function implementMethod(object, lambda) {
  return implement(this, object, lambda)
}


// Define exports on `Method` as it's only thing we export.
Method.implement = implement
Method.define = define
Method.Method = Method
Method.Null = Null
Method.Undefined = Undefined
Method.Default = Default
Method.Builtins = Builtins

module.exports = Method
