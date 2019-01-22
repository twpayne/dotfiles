'use strict';

var
  ES5Class = require('..');

var Animal = ES5Class.$define(
  // Class Name
  'Animal',

  // Prototype methods/variables, these will only be available through a class instance, in this case, through Animal.$create('Name')
  {
    construct: function (name, type){ // this is called automatically on instantiation
      this.name = name;
      this.type = type;
    },
    getName  : function (){
      return this.name;
    }
  },

  // Class methods/variables, this will only be available through Animal, as in Animal.count or Animal.getCount()
  {
    count   : 0,
    getCount: function (){
      return this.count;
    }
  }
);

var Bird = Animal.$define('Bird', {
  construct: function ($super, name, canFly){
    $super(name, 'Bird'); // calls parent class constructor, calls Animal.prototype.construct and set this.name = 'Yellow ' + name

    if (canFly) {
      this.canFly = canFly;
    }
  },

  canFly: false
});

Bird.$include({ // include is like doing _.extend(Bird.prototype, {}) but with proper wrapping the methods for _super access
  fly: function (){
    if (this.canFly) {
      console.log(this.name + ' flies!');
    } else {
      console.log(this.name + ' cant fly');
    }
  }
});

Bird.$include(function (_super){ // _super is the Animal prototype (the parent), it contains only "construct" and "getName" per definitions above
  var timesBeaked = 0;
  // "this" refers to the current Class definition, that is, Bird, so you can access
  // static variables plus the prototype, before it's [re]defined
  //
  // this.prototype.getName();
  // this.count
  //
  // you may want to set var self = this; for usage inside the functions
  return {
    beak: function (){
      return ++timesBeaked;
    }
  };
});

Bird.$implement(function (_super){ // _super is the Animal class itself (the parent)
  // "this" refers to the current Class definition, the same way it happens
  // when extending the prototype (using $include), you may access this.prototype in
  // here as well
  var catalog = {};

  return {
    catalog: function (){ // Bird.catalog() is now available
      if (arguments.length) {
        for (var i = 0; i < arguments.length; i++) {
          catalog[arguments[i].name] = arguments[i];
        }
      }
      return catalog;
    }
  };
});

var swallow = Bird.$create('Swallow', true);
var ostrich = Bird.$create('Ostrich');

swallow.fly();
ostrich.fly();

console.log('Bird.catalog(swallow, ostrich):', Bird.catalog(swallow, ostrich));

var
  Class1 = ES5Class.$define('Class1', {}, {done: true}),
  Class2 = ES5Class.$define('Class2', {func: function (){ return true; }}),
  Class3 = ES5Class.$define('Class3', {}, {yet: true});

// This mix in the whole class (prototype and class methods)
var NewClass = ES5Class.$define('NewClass', {}, [Class1, Class2, Class3]);

// Pay attention that it needs to go in the second parameter if you want
// to copy the object properties AND the prototype properties

// or using NewClass.$implement([Class1, Class2, Class3]);

Class1.done = false; // Changing the base classes doesn't change the mixin'd class

console.log('NewClass.done:', NewClass.done); // true
console.log('NewClass.yet:', NewClass.yet); // true
console.log('NewClass.$parent:', NewClass.$parent); // ES5Class
console.log('NewClass.$implements:', NewClass.$implements); // [Class1,Class2,Class3]
console.log('NewClass.$create().func():', NewClass.$create().func()); // true
console.log('NewClass.$create().$class.done:', NewClass.$create().$class.done); // true
console.log('NewClass.$create().$instanceOf(Class1):', NewClass.$create().$instanceOf(Class1)); // false
console.log('NewClass.$create().$instanceOf(ES5Class):', NewClass.$create().$instanceOf(ES5Class)); // true

// This mix in class methods as prototypes
NewClass = ES5Class.$define('NewClass', [Class1, Class2, Class3]);

console.log('NewClass.$create().yet:', NewClass.$create().yet); // true
console.log('NewClass.$create().done:', NewClass.$create().done); // false
console.log('NewClass.$create().func:', NewClass.$create().func); // undefined