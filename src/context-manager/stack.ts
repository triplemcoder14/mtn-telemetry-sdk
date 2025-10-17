import { Context, ContextManager, ROOT_CONTEXT } from '@opentelemetry/api';

export class StackContextManager implements ContextManager {
  private _stack: Context[] = [];
  private _enabled = false;

  active(): Context {
    return this._stack.length > 0 ? this._stack[this._stack.length - 1] : ROOT_CONTEXT;
  }

  with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
      context: Context,
      fn: F,
      thisArg?: ThisParameterType<F>,
      ...args: A
  ): ReturnType<F> {
    if (!this._enabled) {
      return fn.apply(thisArg as any, args);
    }

    this._stack.push(context);
    try {
      return fn.apply(thisArg as any, args);
    } finally {
      this._stack.pop();
    }
  }

  bind<T>(context: Context, target: T): T {
    if (!this._enabled) {
      return target;
    }

    if (typeof target === 'function') {
      const boundContextManager = this;
      const boundFn = function bound(this: unknown, ...args: unknown[]) {
        return boundContextManager.with(context, target as any, this, ...args);
      };
      return boundFn as unknown as T;
    }

    return target;
  }

  enable(): this {
    this._enabled = true;
    return this;
  }

  disable(): this {
    this._enabled = false;
    this._stack = [];
    return this;
  }
}
