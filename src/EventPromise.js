// TODO: Try to avoid using when, implement mini promises if needed
var when = require("when");

function _getEventPromise(obj) {
    if (!obj.hasOwnProperty("_eventPromise")) {
        Object.defineProperty(obj, "_eventPromise",{enumerable:false, writable: true});
        obj._eventPromise = {};
    }
    return obj._eventPromise;
}

function on (eventName, handlerName, handler, dependencies) {
    var ep = _getEventPromise(this);
    if (typeof dependencies === "undefined" ) {
        dependencies = [];
    }

    if (!ep.hasOwnProperty(eventName)) {
        ep[eventName] = {};
    }
    if (ep[eventName].hasOwnProperty(handler)) {
        throw new Error("The object already has a handler called "+ handlerName + " for the event " + eventName);
    }
    ep[eventName][handlerName] = {
        fn: handler,
        deps: dependencies
    };

}

var EventHandlerTriggerer = function(handlerFn,handlerName, data) {
    this.handlerFn = handlerFn;
    this.data = data;
    this.handlerName = handlerName;
};

EventHandlerTriggerer.prototype.trigger = function (deps) {

    return this.handlerFn.call(this, this.data, deps);
};

function trigger (eventName, data) {

    var ep = _getEventPromise(this);

    // If we don't have an event listenin, do nothing
    if (!ep.hasOwnProperty(eventName)) {
        return;
    }


    var promises = {};
    var promiseArray = [];

    var handlers = ep[eventName];
    var handlerName;

    // For each event handler, create a promise that it will be called
    // and resolved
    for (handlerName in handlers) {
        promises[handlerName] = when.defer();
        promiseArray.push(promises[handlerName].promise);
    }

    // Execute each event handler once its dependencies have been met
    for (handlerName in handlers) {
        var dep;
        var deps = [];

        // For each dependency
        for (var i = 0; i < handlers[handlerName].deps.length ; i++) {
            dep = handlers[handlerName].deps[i];

            // check it exists
            if (!promises.hasOwnProperty(dep)) {
                return when.reject("object doesn't have a handler called " + dep);
            }

            // add it to a dependencies promise
            deps.push(promises[dep].promise);
        }

        var eht = new EventHandlerTriggerer(handlers[handlerName].fn, handlerName, data);
        // When all the dependencies have been met, execute the handler
        var p = when.all(deps).then(eht.trigger.bind(eht));
        // and resolve its promise
        promises[handlerName].resolve(p);

    }

    // Return a promise that will resolve once all event handlers are resolved
    return when.all(promiseArray);
}

exports.create = function () {
    return {
        on,
        trigger
    }
}

exports.mixin = function(obj) {
    obj.on = on;
    obj.trigger = trigger;
};


