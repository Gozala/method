"use strict";

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
var typefy = Object.prototype.toString

var types = {
  "function": "Object:",
  "object": "Object:"
}

function Method(hint) {
  /**
  Private Method is a callable private name that dispatches on the first
  arguments same named Method: Method(...rest) => rest[0][Method](...rest)
  Default implementation may be passed in as an argument.
  **/

  // Create an internal unique name if default implementation is passed,
  // use it"s name as a name hint.
  var prefix = typeof(hint) === "string" ? hint : ""
  var name = prefix + "#" + Math.random().toString(32).substr(2)

  function dispatch() {
    // Method dispatches on type of the first argument.
    var target = arguments[0]
    // If first argument is `null` or `undefined` use associated property
    // maps for implementation lookups, otherwise attempt to use implementation
    // for built-in falling back for implementation on the first argument.
    // Finally use default implementation if no other one is found.
    var method = target === null ? builtin["Null:" + name] :
                 target === void(0) ? builtin["Void:" + name] :
                 target[name] ||
                 implementation[target["!" + name]] ||
                 (target.constructor ? builtin[target.constructor.name + ":" + name] : null) ||
                 builtin[types[typeof(target)] + name]

    method = method || builtin["Default:" + name]


    // If implementation not found there"s not much we can do about it,
    // throw error with a descriptive message.
    if (!method) throw Error("Type does not implements method")

    // If implementation is found delegate to it.
    return method.apply(method, arguments)
  }

  if (typeof(hint) === "function")
    builtin["Default:" + name] = hint

  // Define `Method.toString` returning private name, this hack will enable
  // Method definition like follows:
  // var foo = Method()
  // object[foo] = function() { /***/ }
  dispatch.toString = function toString() { return name }

  // Copy utility Methods for convenient API.
  dispatch.implement = implementMethod
  dispatch.define = defineMethod

  return dispatch
}

var implementation = {}
var builtin = {}

var implement = Method()
var define = Method()


function _implement(method, object, lambda) {
  /**
  Implements `Method` for the given `object` with a provided `implementation`.
  Calling `Method` with `object` as a first argument will dispatch on provided
  implementation.
  **/
  return defineProperty(object, method.toString(), {
    enumerable: false,
    configurable: false,
    writable: false,
    value: lambda
  })
}

function _define(method, Type, lambda) {
  /**
  Defines `Method` for the given `Type` with a provided `implementation`.
  Calling `Method` with a first argument of this `Type` will dispatch on
  provided `implementation`. If `Type` is a `Method` default implementation
  is defined. If `Type` is a `null` or `undefined` `Method` is implemented
  for that value type.
  **/
  var type = Type && typefy.call(Type.prototype)
  if (!lambda) builtin["Default:" + method] = Type
  else if (Type === null) builtin["Null:" + method] = lambda
  else if (Type === void(0)) builtin["Void:" + method] = lambda
  else if (type !== "[object Object]" && Type.name)
    builtin[Type.name + ":" + method] = lambda
  else if (Type.name === "Object")
    builtin["Object:" + method] = lambda
  else
    implement(method, Type.prototype, lambda)
}

var defineMethod = function defineMethod(Type, lambda) {
  return _define(this, Type, lambda)
}
var implementMethod = function implementMethod(object, lambda) {
  return _implement(this, object, lambda)
}

_define(define, _define)
_define(implement, _implement)

// Define exports on `Method` as it's only thing we export.
Method.implement = implement
Method.define = define
Method.Method = Method
Method.builtin = builtin
Method.implementation = implementation

module.exports = Method
