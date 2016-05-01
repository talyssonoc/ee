const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

const EventEmitter = require('events').EventEmitter;
const emitter = new EventEmitter();

const EventEmitter2 = require('eventemitter2').EventEmitter2;
const emitter2 = new EventEmitter2();

const EventEmitter3 = require('eventemitter3');
const emitter3 = new EventEmitter3();

const EE = require('../../').EventEmitter;
const ee = new EE();

suite

  .add('EventEmitter (core)', function() {
    emitter.on('test1', function () { 1==1; });
    emitter.on('test1', function () { 1==1; });
    emitter.on('test1', function () { 1==1; });
    emitter.emit('test1', {});
    emitter.removeAllListeners('test1');
  })

  .add('EventEmitter2', function() {
    emitter2.on('test2', function () { 1==1; });
    emitter2.on('test2', function () { 1==1; });
    emitter2.on('test2', function () { 1==1; });
    emitter2.emit('test2', {});
    emitter2.removeAllListeners('test2');
  })

  .add('EventEmitter2 (wild-cards)', function() {
    emitter2.on('test2.*', function () { 1==1; });
    emitter2.on('test2.*', function () { 1==1; });
    emitter2.on('test2.*', function () { 1==1; });
    emitter2.emit('test2.foo', {});
    emitter2.removeAllListeners('test2.*');
  })

  .add('EventEmitter3', function() {
    emitter3.on('test3', function () { 1==1; });
    emitter3.on('test3', function () { 1==1; });
    emitter3.on('test3', function () { 1==1; });
    emitter3.emit('test3', {});
    emitter3.removeAllListeners('test3');
  })

  .add('EE', function() {
    ee.on('testEE', function () { 1==1; });
    ee.on('testEE', function () { 1==1; });
    ee.on('testEE', function () { 1==1; });
    ee.emit('testEE', {});
    ee.removeAllListeners('testEE');
  })

  .on('cycle', function(event, bench) {
    console.log(String(event.target));
  })

  .on('complete', function() {
    console.log('\nFastest is ' + this.filter('fastest').map('name'));
  })

  .run(true);
