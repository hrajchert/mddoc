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
  on: (
    eventName: EventName,
    handlerName: HandlerName,
    handler: HandlerFn,
    dependencies?: string[],
  ) => EventPromiseMixin;
  trigger: (eventName: EventName, data?: unknown) => Promise<unknown>;
};

type FixAnyUsingClass = any;

function _getEventPromise(obj: EventPromiseMixin): EventPromiseMap {
  if (!obj.hasOwnProperty("_eventPromise") || obj._eventPromise === undefined) {
    Object.defineProperty(obj, "_eventPromise", {
      enumerable: false,
      writable: true,
    });
    obj._eventPromise = {};
  }
  return obj._eventPromise;
}

function on(
  this: EventPromiseMixin,
  eventName: string,
  handlerName: string,
  handler: HandlerFn,
  dependencies: string[] = [],
) {
  var ep = _getEventPromise(this);

  if (!ep.hasOwnProperty(eventName)) {
    ep[eventName] = {};
  }
  if (ep[eventName].hasOwnProperty(handlerName)) {
    throw new Error(
      "The object already has a handler called " +
        handlerName +
        " for the event " +
        eventName,
    );
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

async function trigger(
  this: FixAnyUsingClass,
  eventName: EventName,
  data: unknown,
): Promise<unknown> {
  var ep = _getEventPromise(this);

  // If we don't have an event listenin, do nothing
  if (!ep.hasOwnProperty(eventName)) {
    return;
  }

  var promises: Record<HandlerName, DeferredPromise<unknown>> = {};
  var promiseArray = [];

  var handlers = ep[eventName];

  // For each event handler, create a promise that it will be called
  // and resolved
  for (let handlerName in handlers) {
    promises[handlerName] = defer();
    promiseArray.push(promises[handlerName].promise);
  }

  // Execute each event handler once its dependencies have been met
  for (let handlerName in handlers) {
    var dep;
    var deps = [];

    // For each dependency
    for (var i = 0; i < handlers[handlerName].deps.length; i++) {
      dep = handlers[handlerName].deps[i];

      // check it exists
      if (!promises.hasOwnProperty(dep)) {
        throw new Error("object doesn't have a handler called " + dep);
      }

      // add it to a dependencies promise
      deps.push(promises[dep].promise);
    }

    var eht = new EventHandlerTriggerer(
      handlers[handlerName].fn,
      handlerName,
      data,
    );
    // When all the dependencies have been met, execute the handler
    var p = Promise.all(deps).then(eht.trigger.bind(eht));
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
