import type { Context, ContextManager } from '@opentelemetry/api';
import { ROOT_CONTEXT } from '@opentelemetry/api';

type WithTarget<T> = (...args: any[]) => T;

export class StackContextManager implements ContextManager {
  private _stack: Context[] = [];
  private _enabled = false;

  active(): Context {
    return this._stack.length > 0 ? this._stack[this._stack.length - 1] : ROOT_CONTEXT;
  }

  with<T extends WithTarget<any>>(
    context: Context,
    fn: T,
    thisArg?: ThisParameterType<T>,
    ...args: Parameters<T>
  ): ReturnType<T> {
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

  bind<T>(target: T): T;
  bind<T>(context: Context, target: T): T;
  bind<T>(contextOrTarget: Context | T, maybeTarget?: T): T {
    const target = maybeTarget ?? (contextOrTarget as T);
    const context = (maybeTarget ? (contextOrTarget as Context) : this.active()) ?? ROOT_CONTEXT;

    if (!this._enabled) {
      return target;
    }

    if (typeof target === 'function') {
      const boundContextManager = this;
      const boundFn = function bound(this: unknown, ...args: unknown[]) {
        return boundContextManager.with(
          context,
          target as unknown as (...args: unknown[]) => unknown,
          this,
          ...args
        );
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