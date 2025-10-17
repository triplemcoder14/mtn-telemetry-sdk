function createHook() {
  return {
    enable() {
      return this;
    },
    disable() {
      return this;
    },
  };
}

function executionAsyncId() {
  return 0;
}

function triggerAsyncId() {
  return 0;
}

class AsyncResource {
  constructor() {}
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.apply(thisArg, args);
  }
  emitDestroy() {}
}

class AsyncLocalStorage {
  constructor() {
    this._store = undefined;
  }

  disable() {
    this._store = undefined;
  }

  getStore() {
    return this._store;
  }

  enterWith(value) {
    this._store = value;
  }

  run(store, callback, ...args) {
    this._store = store;
    try {
      return callback(...args);
    } finally {
      this._store = undefined;
    }
  }
}

module.exports = {
  createHook,
  executionAsyncId,
  triggerAsyncId,
  AsyncResource,
  AsyncLocalStorage,
};
