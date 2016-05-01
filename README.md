  # ee

  `ee` is an experimental event emitter. __Don't use it__.

  [![Build Status](https://travis-ci.org/talyssonoc/ee.svg?branch=master)](https://travis-ci.org/talyssonoc/ee)

  ## Benchmark

  ```
  EventEmitter (core) x 758,245 ops/sec ±2.46% (77 runs sampled)
  EventEmitter2 x 723,897 ops/sec ±2.80% (78 runs sampled)
  EventEmitter2 (wild-cards) x 734,017 ops/sec ±2.50% (72 runs sampled)
  EventEmitter3 x 417,032 ops/sec ±1.63% (78 runs sampled)
  EE x 378,016 ops/sec ±1.64% (76 runs sampled)

  Fastest is EventEmitter (core)
  ```

  * I'm gonna use that as a goal to improve my knowledge about V8 performance :smile:

  ## Developing

  First of all install all dependencies with `npm install`.

  ## Running tests

  Just run `npm test`.

  ## Running benchmarks

  Just run `npm run benchmark`.