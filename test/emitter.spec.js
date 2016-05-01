const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

const Emitter = require('../');

describe('EE', () => {
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
      
      expect(listenerTwo).to.not.been.called;
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

  describe('.setPromise', () => {
    const Bluebird = require('bluebird');
    
    it('should change internal promise library', () => {
      Emitter.setPromise(Bluebird);

      expect(Emitter._Promise).to.be.equal(Bluebird);

      Emitter.setPromise(Promise);

      expect(Emitter._Promise).to.be.equal(Promise);
    });

    it('should use internal promise library on async emits', () => {
      Emitter.setPromise(Bluebird);

      const emitter = new Emitter();
      const listener = () => Promise.resolve();
      emitter.on('stuff', listener);

      expect(emitter.emitAsync('stuff', {})).to.be.an.instanceof(Bluebird);

      Emitter.setPromise(Promise);
    });
  });
});
