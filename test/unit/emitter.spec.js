const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

const Emitter = require('../../');

describe('EE', () => {
  describe('._Promise', () => {
    it('initially sets _Promise to Node promise implementation', () => {
      expect(Emitter._Promise).to.be.equal(Promise);
    });
  });

  describe('.setPromise', () => {
    const Bluebird = require('bluebird');
    
    it('should change internal promise library', () => {
      Emitter.setPromise(Bluebird);

      expect(Emitter._Promise).to.be.equal(Bluebird);

      Emitter.setPromise();

      expect(Emitter._Promise).to.be.equal(Promise);
    });

    it('should use internal promise library on async emits', () => {
      Emitter.setPromise(Bluebird);

      const emitter = new Emitter();
      const listener = () => Promise.resolve();
      emitter.on('stuff', listener);

      expect(emitter.emitAsync('stuff', {})).to.be.an.instanceof(Bluebird);

      Emitter.setPromise();
    });
  });

  describe('.EventEmitter', () => {
    it('should be backward compatible with Node EventEmitter', () => {
      expect(Emitter.EventEmitter).to.be.equal(Emitter);
    });
  });

  describe('#_listeners', () => {
    it('should not be instance of object', () => {
      const emitter = new Emitter();
      expect(emitter._listeners).to.not.be.an.instanceof(Object);
    });
  });

  describe('#on', () => {
    it('should add listener correctly', () => {
      const emitter = new Emitter();
      const listener = () => {};
      emitter.on('stuff', listener);

      expect(emitter._listeners.stuff[0]).to.be.equal(listener);
    });

    it('should increase _eventsCount correctly', () => {
      const emitter = new Emitter();
      const listener = () => {};
      emitter.on('stuff', listener);
      emitter.on('stuff', listener);
      emitter.on('stuff_2', listener);

      expect(emitter._eventsCount).to.be.equal(2);
    });
  });

  describe('#once', () => {
    it('should remove listener after trigger', () => {
      const emitter = new Emitter();
      const listener = () => {};
      emitter.once('stuff', listener);

      const listeners = emitter._listeners;

      emitter.emit('stuff', {});

      expect(emitter._eventsCount).to.be.equal(0);
      expect(emitter._listeners).to.not.be.equal(listeners);
    });
  });

  describe('#onAny', () => {
    it('should trigger for any event', () => {
      const emitter = new Emitter();
      const listener = sinon.spy();
      emitter.onAny(listener);
      emitter.emit('stuff', {});

      expect(listener).to.have.been.calledWith('stuff', {});
    });
  });

  describe('#onceAny', () => {
    it('should remove listener after trigger', () => {
      const emitter = new Emitter();
      const listener = sinon.spy();
      emitter.onceAny(listener);
      emitter.emit('stuff', {});

      expect(listener).to.have.been.calledWith('stuff', {});
      expect(emitter._listenersAny).to.be.undefined;
    });
  });

  describe('#emit', () => {
    it('should trigger correctly', () => {
      const emitter = new Emitter();
      const listener = sinon.spy();
      emitter.on('stuff', listener);
      emitter.emit('stuff', {});

      expect(listener).to.have.been.calledWith({});
    });
  });

  describe('#emitAsync', () => {
    context('in parallel', () => {
      it('should trigger correctly', () => {
        const emitter = new Emitter();
        const spy = sinon.spy();
        const listener = (payload) => new Promise((resolve) => {
          setTimeout(() => {
            spy(payload);
            resolve({});
          }, 10);
        });

        emitter.on('stuff', listener);
        emitter.on('stuff', listener);
        return emitter.emitAsync('stuff', {})
          .then(() => {
            expect(spy).to.always.have.been.calledWith({});
          });
      });

      context('has no listeners', () => {
        it('should resolve anyway', () => {
          const emitter = new Emitter();

          // Fail if timeout
          return emitter.emitAsync('stuff', {});
        });        
      });

      it('should trigger any listeners too', () => {
        const emitter = new Emitter();
        const spyOne = sinon.spy();
        const spyTwo = sinon.spy();
        const listenerOne = (payload) => new Promise((resolve) => {
          setTimeout(() => {
            spyOne(payload);
            resolve({});
          }, 20);
        });
        const listenerTwo = (type, payload) => new Promise((resolve) => {
          setTimeout(() => {
            spyTwo(type, payload);
            resolve({});
          }, 10);
        });

        emitter.on('stuff', listenerOne);
        emitter.onAny(listenerTwo);
        return emitter.emitAsync('stuff', {})
          .then(() => {
            expect(spyOne).to.have.been.calledWith({});
            expect(spyTwo).to.have.been.calledWith('stuff', {});
          });
      });
    });

    context('in series', () => {
      it('should trigger in order', () => {
        const emitter = new Emitter();
        const spyOne = sinon.spy();
        const spyTwo = sinon.spy();
        const listenerOne = (payload) => new Promise((resolve) => {
          setTimeout(() => {
            spyOne(payload);
            resolve({});
          }, 20);
        });
        const listenerTwo = (payload) => new Promise((resolve) => {
          setTimeout(() => {
            spyTwo(payload);
            resolve({});
          }, 10);
        });

        emitter.on('stuff', listenerOne);
        emitter.on('stuff', listenerTwo);

        return emitter.emitAsync('stuff', {}, true)
          .then(() => {
            expect(spyOne).to.have.been.calledWith({});
            expect(spyTwo).to.have.been.calledWith({});
            expect(spyOne).to.have.been.calledBefore(spyTwo);
          });
      });

      context('has no listeners', () => {
        it('should resolve anyway', () => {
          const emitter = new Emitter();

          // Fail if timeout
          return emitter.emitAsync('stuff', {}, true);
        });        
      });

      it('should trigger any listeners too', () => {
        const emitter = new Emitter();
        const spyOne = sinon.spy();
        const spyTwo = sinon.spy();
        const listenerOne = (payload) => new Promise((resolve) => {
          setTimeout(() => {
            spyOne(payload);
            resolve({});
          }, 20);
        });
        const listenerTwo = (type, payload) => new Promise((resolve) => {
          setTimeout(() => {
            spyTwo(type, payload);
            resolve({});
          }, 10);
        });

        emitter.on('stuff', listenerOne);
        emitter.onAny(listenerTwo);
        return emitter.emitAsync('stuff', {}, true)
          .then(() => {
            expect(spyOne).to.have.been.calledWith({});
            expect(spyTwo).to.have.been.calledWith('stuff', {});
            expect(spyOne).to.have.been.calledBefore(spyTwo);
          });
      });
    });
  });

  describe('#off', () => {
    it('should remove listener correctly', () => {
      const emitter = new Emitter();
      const listener = () => {};
      emitter.on('stuff', listener);
      emitter.on('stuff', listener);
      emitter.off('stuff', listener);

      expect(emitter._listeners.stuff).to.have.lengthOf(1);
    });

    context('have no listeners to given event', () => {
      it('should do nothing', () => {
        const emitter = new Emitter();
        const listener = () => {};
        
        expect(() => {
          emitter.off('stuff', listener);
        }).to.not.throw(Error);
      });
    });

    context('listener do not apply to given event', () => {
      it('should do nothing', () => {
        const emitter = new Emitter();
        const listenerOne = () => {};
        const listenerTwo = () => {};
        emitter.on('stuff', listenerOne);
        
        expect(() => {
          emitter.off('stuff', listenerTwo);
        }).to.not.throw(Error);
      });
    });

    it('should decrease _eventsCount correctly', () => {
      const emitter = new Emitter();
      const listener = () => {};
      emitter.on('stuff', listener);
      emitter.on('stuff_2', listener);
      emitter.off('stuff', listener);

      expect(emitter._eventsCount).to.be.equal(1);
    });

    context('all listeners were removed', () => {
      it('should create new _listeners object', () => {
        const emitter = new Emitter();
        const listener = () => {};
        emitter.on('stuff', listener);

        const listeners = emitter._listeners;

        emitter.off('stuff', listener);

        expect(emitter._listeners).to.not.be.equal(listeners);
      });
    });

    context('all listeners of a given event were removed', () => {
      it('should remove listener property from _listeners', () => {
        const emitter = new Emitter();
        const listener = () => {};
        emitter.on('stuff', listener);
        emitter.on('stuff_2', listener);
        emitter.off('stuff', listener);

        expect(emitter._listeners.stuff).to.be.undefined;
      });
    });
  });

  describe('#offAny', () => {
    it('should remove from _listenersAny', () => {
      const emitter = new Emitter();
      const listenerOne = sinon.spy();
      const listenerTwo = sinon.spy();
      emitter.onAny(listenerOne);
      emitter.onAny(listenerTwo);
      emitter.offAny(listenerOne);
      emitter.emit('stuff', {});

      expect(listenerOne).to.have.not.been.called;
      expect(listenerTwo).to.have.been.calledWith('stuff', {});
      expect(emitter._listenersAny).to.have.lengthOf(1);
    });

    context('has not any listeners at all', () => {
      it('should do nothing', () => {
        const emitter = new Emitter();
        const listener = () => {};
        
        expect(() => {
          emitter.offAny(listener);
        }).to.not.throw(Error);
      });
    });

    context('listener is not an any listener', () => {
      it('should do nothing', () => {
        const emitter = new Emitter();
        const listenerOne = () => {};
        const listenerTwo = () => {};

        emitter.onAny(listenerOne);
        
        expect(() => {
          emitter.offAny(listenerTwo);
        }).to.not.throw(Error);
      });
    });

    context('remove all any listeners', () => {
      it('should delete _listenersAny', () => {
        const emitter = new Emitter();
        const listener = sinon.spy();
        emitter.onAny(listener);
        emitter.offAny(listener);

        expect(emitter._listenersAny).to.be.undefined;

        emitter.onAny(listener);
        expect(emitter._listenersAny).to.be.instanceof(Array);
      });
    });
  });

  describe('#offAll', () => {
    it('should remove all listeners', () => {
      const emitter = new Emitter();
      const listener = sinon.spy();
      emitter.on('stuff', listener);
      emitter.onAny(listener);

      const listeners = emitter._listeners;
      emitter.offAll();

      expect(emitter._listeners).to.not.be.equal(listeners);
      expect(emitter._eventsCount).to.be.equal(0);
      expect(emitter._pipes).to.be.undefined;
      expect(emitter._listenersAny).to.be.undefined;
    });

    it('should remove all listeners to given event', () => {
      const emitter = new Emitter();
      const listener = () => {};
      emitter.on('stuff', listener);
      emitter.on('stuff_2', listener);

      emitter.offAll('stuff');

      expect(emitter._eventsCount).to.be.equal(1);
      expect(emitter._listeners.stuff).to.be.undefined;
    });

    it('should not call listener', () => {
      const emitter = new Emitter();
      const listenerOne = sinon.spy();
      const listenerTwo = sinon.spy();
      emitter.on('stuff', listenerOne);
      emitter.onAny(listenerTwo);

      emitter.offAll('stuff');
      emitter.emit('stuff', {});

      expect(listenerOne).to.have.not.been.called;
      expect(listenerTwo).to.have.been.calledWith('stuff', {});
    });
  });

  describe('#listeners', () => {
    it('should return listeners to given event', () => {
      const emitter = new Emitter();
      const listenerOne = () => {};
      const listenerTwo = () => {};
      emitter.on('stuff', listenerOne);
      emitter.on('stuff', listenerTwo);

      expect(emitter.listeners('stuff')).to.be.eql([listenerOne, listenerTwo]);
    });

    context('there is no listeners', () => {
      it('should return an empty array', () => {
        const emitter = new Emitter();

        expect(emitter.listeners('stuff')).to.be.empty;
      });
    });
  });

  describe('#listenersAny', () => {
    it('should return all listeners to any event', () => {
      const emitter = new Emitter();
      const listenerOne = () => {};
      const listenerTwo = () => {};
      emitter.onAny(listenerOne);
      emitter.onAny(listenerTwo);

      expect(emitter.listenersAny('stuff')).to.be.eql([listenerOne, listenerTwo]);
    });

    context('there is no listeners to any event', () => {
      it('should return an empty array', () => {
        const emitter = new Emitter();

        expect(emitter.listenersAny()).to.be.empty;
      });
    });
  });

  describe('#pipe', () => {
    it('should pipe events to other emitter', () => {
      const emitterOne = new Emitter();
      const emitterTwo = new Emitter();
      const listenerOne = sinon.spy();
      const listenerTwo = sinon.spy();
      emitterOne.pipe(emitterTwo, 'one');
      emitterTwo.on('one:stuff', listenerOne);
      emitterTwo.onAny(listenerTwo);
      emitterOne.emit('stuff', {});

      expect(listenerOne).to.have.been.calledWith({});
      expect(listenerTwo).to.have.been.calledWith('one:stuff', {});
    });

    context('already has a pipe to other emitter', () => {
      it('should throw an error', () => {
        const emitterOne = new Emitter();
        const emitterTwo = new Emitter();
        emitterOne.pipe(emitterTwo, 'one');
        
        expect(() => {
          emitterOne.pipe(emitterTwo, 'two');
        }).to.throw(Error);
      });
    });    
  });

  describe('#unpipe', () => {
    it('should upipe two emitters', () => {
      const emitterOne = new Emitter();
      const emitterTwo = new Emitter();
      const listenerOne = sinon.spy();
      const listenerTwo = sinon.spy();
      emitterOne.pipe(emitterTwo, 'one');
      emitterTwo.on('one:stuff', listenerOne);
      emitterOne.emit('stuff', {});

      expect(listenerOne).to.have.been.calledWith({});

      emitterTwo.on('one:stuff', listenerTwo);
      emitterOne.unpipe(emitterTwo);
      emitterOne.emit('stuff', {});
      
      expect(listenerTwo).to.have.not.been.called;
    });

    context('is not piped', () => {
      it('should throw an error', () => {
        const emitterOne = new Emitter();
        const emitterTwo = new Emitter();

        expect(() => {
          emitterOne.unpipe(emitterTwo);
        }).to.throw(Error);
      });

      it('should throw an error', () => {
        const emitterOne = new Emitter();
        const emitterTwo = new Emitter();
        const emitterThree = new Emitter();

        emitterOne.pipe(emitterTwo);

        expect(() => {
          emitterOne.unpipe(emitterThree);
        }).to.throw(Error);
      });
    });
  });
});
