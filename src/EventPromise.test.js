import * as EventPromise from "./EventPromise.js"
import when from "when";
import delay from "when/delay";

describe ("EventPromise", function () {

    describe("creation", function () {
        test("should mix on a OL", function(){
            var obj = {};
            EventPromise.mixin(obj);
            expect(obj).toHaveProperty("on");
            expect(obj).toHaveProperty("trigger");
        });
    });

    describe("on method", function () {
        var obj;
        beforeEach(function(){
            obj = {};
            EventPromise.mixin(obj);
        });

        test("should be called after a trigger", function(done) {
            obj.on("myEvent", "handler1", function() {
                done();
            });
            obj.trigger("myEvent");

        });

        test("should pass trigger parameters", function(done) {
            obj.on("myEvent", "handler1", function(arg) {
                expect(arg).toEqual("my argument");
                done();
            });
            obj.trigger("myEvent", "my argument");

        });

        test("should call multiple handlers", function(done) {
            var h1 = when.defer(),
                h2 = when.defer();

            obj.on("myEvent", "handler1", function() {
                h1.resolve();
            });

            obj.on("myEvent", "handler2", function() {
                h2.resolve();
            });

            obj.trigger("myEvent");

            when.all([h1.promise, h2.promise]).then(function(){
                done();
            });

        });

        test("should call the handlers in respecting order", function(done) {
            var handler2Called = false;
            // Define handler1 that depends on handler 2 to be called first
            obj.on("myEvent", "handler1", function(arg, deps) {
                if (!handler2Called) {
                    return done("handler 2 hasnt been called");
                }

                if (arg !== "my argument" || deps[0] !== "handler2Result") {
                    return done("Invalid arguments");
                }

                done();

            }, ["handler2"]);


            obj.on("myEvent", "handler2", function(arg) {
                handler2Called = true;
                expect(arg).toEqual("my argument");
                return "handler2Result";
            });

            obj.trigger("myEvent", "my argument");

        });


        test("should return a promise that is resolved once all handlers are resolved", function(done) {
            var h1Called = false,
                h2Called = false;

            obj.on("myEvent", "handler1", function() {
                return delay(200).then(function(){ h1Called = true;});
            });

            obj.on("myEvent", "handler2", function() {
                return delay(400).then(function(){ h2Called = true;});
            });

            obj.trigger("myEvent").then(function(){
                if (h1Called === false || h2Called === false) {
                    return done("handlers not called");
                }
                done();
            });
        });


    });
});


// Que necesito del coso de plugin?
// Necesito que se pueda registrar (eventualmente con orden o dependencia) acciones a hacer
// Si es por dependencia, se podria lanzar todos asincronicamente
// Creo que deberia ser como un sistema de eventos por promesas, donde te registras a un tipo de evento
// en particular, con algunas dependencias que tienen que pasar antes y devolves una promesa cuando terminas.
// Por ejemplo en read markdown, me registraria al evento fileParsed un par de veces, para
// crear las distintas metadatas sobre el.
