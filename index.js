class Emitter {
  constructor() {
    this._listeners = Object.create(null);
    this._listenersAny = undefined;
    this._pipes = undefined;
    this._eventsCount = 0;
  }

  on(type, listener) {
    if(!this._listeners[type]) {
      this._listeners[type] = [];
      this._eventsCount++;
    }

    this._listeners[type].push(listener);
  }

  once(type, listener) {
    const onceWrapper = (payload) => {
      this.off(type, onceWrapper);
      listener(payload);
    };

    onceWrapper.listener = listener;

    this.on(type, onceWrapper);
  }

  onAny(listener) {
    if(!this._listenersAny) {
      this._listenersAny = [];
    }

    this._listenersAny.push(listener);
  }

  off(type, listener) {
    const listeners = this._listeners[type];

    if(!listeners) {
      return;
    }

    const index = listeners.findIndex((l) => {
      return listener === l || (listener.listener && listener.listener === l);
    });

    if(index < 0) {
      return;
    }

    listeners.splice(index, 1);

    if(listeners.length === 0) {
      if(--this._eventsCount === 0) {
        this._listeners = Object.create(null);
      } else {
        delete this._listeners[type];
      }
    }
  }

  onceAny(listener) {
    const onceWrapper = (type, payload) => {
      this.offAny(onceWrapper);
      listener(type, payload);
    };

    onceWrapper.listener = listener;

    this.onAny(onceWrapper);
  }

  offAny(listener) {
    const listenersAny = this._listenersAny;

    if(!listenersAny) {
      return;
    }

    const index = listenersAny.findIndex((l) => {
      return listener === l || (listener.listener && listener.listener === l);
    });

    if(index < 0) {
      return;
    }

    listenersAny.splice(index, 1);

    if(listenersAny.length === 0) {
      this._listenersAny = undefined;
    }
  }

  offAll(type = false) {
    if(!type) {
      this._listeners = Object.create(null);
      this._listenersAny = undefined;
      this._pipes = undefined;
      this._eventsCount = 0;
      return;
    }

    if(this._listeners[type]) {
      delete this._listeners[type];
      this._eventsCount--;
    }
  }

  emit(type, payload) {
    const listeners = this._listeners[type];
    const listenersAny = this._listenersAny;

    if(listenersAny) {
      listenersAny.forEach((listener) => listener(type, payload));
    }
    
    if(listeners) {
      listeners.forEach((listener) => listener(payload));
    }
  }

  emitAsync(type, payload, series = false) {
    const listeners = this._listeners[type];
    const listenersAny = this._listenersAny;

    if(series) {
      let promiseChain;

      if(listeners) {
        promiseChain = listeners.reduce((chain, listener) => {
          return chain.then(() => listener(payload));
        }, Emitter._Promise.resolve());
      } else {
        promiseChain = Emitter._Promise.resolve();
      }

      if(listenersAny) {
        promiseChain = listenersAny.reduce((chain, listener) => {
          return chain.then(() => listener(type, payload));
        }, promiseChain);
      }

      return promiseChain;
    }

    let promisedListeners;
    if(listeners) {
      promisedListeners = listeners.map((listener) => listener(payload));
    } else {
      promisedListeners = []
    }

    let promisedListenersAny ;
    if(listenersAny) {
      promisedListenersAny = listenersAny.map((listener) => listener(type, payload));
    } else {
      promisedListenersAny = [];
    }

    promisedListeners.push.apply(promisedListeners, promisedListenersAny);

    return Emitter._Promise.all(promisedListeners);
  }

  listeners(type) {
    const listeners = this._listeners[type];

    if(!listeners) {
      return [];
    }

    return listeners;
  }

  listenersAny() {
    const listenersAny = this._listenersAny;

    if(!listenersAny) {
      return [];
    }

    return listenersAny;
  }

  pipe(otherEmitter, _namespace) {
    if(!this._pipes) {
      this._pipes = [];
    }

    const namespace = (_namespace ? `${ _namespace }:` : '');

    const isAlreadyPiped = this._pipes.find((pipe) => pipe.otherEmitter === otherEmitter);

    if(isAlreadyPiped) {
      throw new Error('Was already piped with to the same emitter');
    }

    const pipedListener = (type, payload) => otherEmitter.emit(namespace + type, payload);
    this._pipes.push({
      pipedListener: pipedListener,
      otherEmitter: otherEmitter
    });

    this.onAny(pipedListener);
  }

  unpipe(otherEmitter) {
    if(!this._pipes) {
      throw new Error('Not piped to any other emitter');
    }

    const index = this._pipes.findIndex((pipe) => pipe.otherEmitter === otherEmitter);

    if(index < 0) {
      throw new Error('Not piped to given emitter');
    }

    this.offAny(this._pipes[index].pipedListener);
    this._pipes.splice(index, 1);

    if(this._pipes.length === 0) {
      this._pipes = null;
    }
  }
}

Emitter.prototype.addListener = Emitter.prototype.on;
Emitter.prototype.removeListener = Emitter.prototype.off;
Emitter.prototype.removeAllListeners = Emitter.prototype.offAll;

Emitter._Promise = Promise;

Emitter.setPromise = function setPromise(promiseLibrary = Promise) {
  this._Promise = promiseLibrary;
};

// Backward compatibility with Node native emitter
Emitter.EventEmitter = Emitter;

module.exports = Emitter;
