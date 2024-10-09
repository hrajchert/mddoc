/**
 * This module implements a system for triggering events with dependencies.
 *
 * The idea is that you register event handlers for a given event name.
 * Each handler can specify a list of dependencies, which are other event handlers that must complete before the current handler can execute.
 * When you trigger an event, the system ensures that all dependencies are met before executing any handlers.
 *
 * This is useful for implementing the lifecycle with plugins. But it needs to be revisited.
 *
 * At the very least, change the name.
 */

import { defer, DeferredPromise } from "./utils/promises/defer.js";

type EventName = string;
type HandlerName = string;
type HandlerFn = (data: unknown, deps: unknown[]) => unknown;
type Handler = {
  fn: HandlerFn;
  deps: string[];
};
type EventPromiseMap = Record<EventName, Record<HandlerName, Handler>>;

// TODO: Remove the Mixin and just use a class.
export type EventPromiseMixin = {
  _eventPromise?: EventPromiseMap;
  on: (eventName: EventName, handlerName: HandlerName, handler: HandlerFn, dependencies?: string[]) => EventPromiseMixin;
  trigger: (eventName: EventName, data?: unknown) => Promise<unknown>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FixAnyUsingClass = any;

function _getEventPromise(obj: EventPromiseMixin): EventPromiseMap {
  if (!Object.prototype.hasOwnProperty.call(obj, "_eventPromise") || obj._eventPromise === undefined) {
    Object.defineProperty(obj, "_eventPromise", {
      enumerable: false,
      writable: true,
    });
    obj._eventPromise = {};
  }
  return obj._eventPromise;
}

function on(this: EventPromiseMixin, eventName: string, handlerName: string, handler: HandlerFn, dependencies: string[] = []) {
  const ep = _getEventPromise(this);

  if (!Object.prototype.hasOwnProperty.call(ep, eventName)) {
    ep[eventName] = {};
  }
  if (Object.prototype.hasOwnProperty.call(ep[eventName], handlerName)) {
    throw new Error("The object already has a handler called " + handlerName + " for the event " + eventName);
  }
  ep[eventName][handlerName] = {
    fn: handler,
    deps: dependencies,
  };
  return this;
}

class EventHandlerTriggerer {
  handlerFn: HandlerFn;
  data: unknown;
  handlerName: HandlerName;

  constructor(handlerFn: HandlerFn, handlerName: string, data: unknown) {
    this.handlerFn = handlerFn;
    this.data = data;
    this.handlerName = handlerName;
  }

  trigger(deps: unknown[]) {
    return this.handlerFn.call(this, this.data, deps);
  }
}

async function trigger(this: FixAnyUsingClass, eventName: EventName, data: unknown): Promise<unknown> {
  const ep = _getEventPromise(this);

  // If we don't have an event listenin, do nothing
  if (!Object.prototype.hasOwnProperty.call(ep, eventName)) {
    return;
  }

  const promises: Record<HandlerName, DeferredPromise<unknown>> = {};
  const promiseArray = [];

  const handlers = ep[eventName];

  // For each event handler, create a promise that it will be called
  // and resolved
  for (const handlerName in handlers) {
    promises[handlerName] = defer();
    promiseArray.push(promises[handlerName].promise);
  }

  // Execute each event handler once its dependencies have been met
  for (const handlerName in handlers) {
    let dep;
    const deps = [];

    // For each dependency
    for (let i = 0; i < handlers[handlerName].deps.length; i++) {
      dep = handlers[handlerName].deps[i];

      // check it exists
      if (!Object.prototype.hasOwnProperty.call(promises, dep)) {
        throw new Error("object doesn't have a handler called " + dep);
      }

      // add it to a dependencies promise
      deps.push(promises[dep].promise);
    }

    const eht = new EventHandlerTriggerer(handlers[handlerName].fn, handlerName, data);
    // When all the dependencies have been met, execute the handler
    const p = Promise.all(deps).then(eht.trigger.bind(eht));
    // and resolve its promise
    promises[handlerName].resolve(p);
  }

  // Return a promise that will resolve once all event handlers are resolved
  return Promise.all(promiseArray);
}

export function create() {
  return {
    on,
    trigger,
  };
}

// TODO: Remove mixin functionality, just use a class.
export function mixin(obj: FixAnyUsingClass) {
  obj.on = on;
  obj.trigger = trigger;
}
