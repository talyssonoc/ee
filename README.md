# ee

`ee` is an experimental event emitter. It's not event published to npm. __Don't use it__.

[![Build Status](https://travis-ci.org/talyssonoc/ee.svg?branch=master)](https://travis-ci.org/talyssonoc/ee)

## Usage

```js
const emitter = new EE();

// Use the emitter and be happy
```

## Docs

- `#on(type, listener)`: Run `listener` when `type` event is emitted. Alias: `#addListener`
- `#off(type, listener)`: Stop `listener` to listening `type` events. Alias: `#removeListener`
- `#once(type, listener)`: Run `listener` the first time `type` event is emitted then stop listening
- `#onAny(listener)`: Run `listener` whenever an event is emitted
- `#offAny(listener)`: Stop `listener` to whatever events
- `#onceAny(listener)`: Run `listener` the first time some event is emitted then stop listening
- `#offAll([type])`: Remove all listeners to `type` events. If no `type` is passed, remove all`listeners. Alias: `#removeAllListeners`
- `#emit(type, payload)`: Emit a `type` event with `payload`
- `#emitAsync(type, payload, series = false)`: Emit a `type` event with `payload` asyncly and return the promise. If series is `false`, will run listeners with `Promise.all`, otherwise will run the listeners in series creating a prototype chain and return it
- `#listeners(type)`: Return all listeners directly listening to `type` events. Listeners added with `#onAny` or `#onceAny` wil not be included
- `#listenersAny()`: Return all listeners added with `#onAny` or `#onceAny`
- `#pipe(otherEmitter[, namespace])`: Pipe all events to `otherEmitter`. If `namespace` is passed, `'<namespace>:'` will be prepended to event name emitted on `otherEmitter`
- `#unpipe(otherEmitter)`: Stop piping events to `otherEmitter`
- `.setPromise(promiseLibrary = Promise)`: Set internal promise library used on async operations. If no `promiseLibrary` is passed, will use default NodeJS promise implementation. __This method should be called on `EE`, not in an instance__

## Benchmark

```
EventEmitter (core) x 758,245 ops/sec ±2.46% (77 runs sampled)
EventEmitter2 x 723,897 ops/sec ±2.80% (78 runs sampled)
EventEmitter2 (wild-cards) x 734,017 ops/sec ±2.50% (72 runs sampled)
EventEmitter3 x 417,032 ops/sec ±1.63% (78 runs sampled)
EE x 378,016 ops/sec ±1.64% (76 runs sampled)

Fastest is EventEmitter (core)
```

_* I'm gonna use that as a goal to improve my knowledge about V8 performance :smile:_

## Developing

First of all install all dependencies with `npm install`.

## Running tests

Just run `npm test`.

## Running benchmarks

Just run `npm run benchmark`.