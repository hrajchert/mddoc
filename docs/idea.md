## The idea

The idea of this project is to be a documentation tool that holds one way references from the documentation to the code, and hopefully has a way of indicating when the documentation is obsolete.

I will try to expose some of the guidelines I want this project to follow, that will explain why I make the decisions I make. Whenever posible, I would like each commit to be a statement that empowers one of this guidelines. For example, the very first commit was a proof of
concept of the [self used](#self-used).


Los Feautures que por ahora quiero marcar son la referencia al codigo, y el manejo de conflictos (desincronizacion), y la creacion de la documentacion por medio de un template system (relacionado con guideline "no opinado")



flat files!
Tiene que ser cortito y al pie, resolver un set de funcionalidades justas que permitan la elaboracion de cosas mas copadas encima, como puede ser el plugin de bracket o la tarea de grunt. Eso es mas que nada porque no quiero obligar a la gente a que use grunt o que use brackets.
El proyecto estaria bueno que sea "utilizable como libreria". Entonces, si bien va a haber algun tipo de herramienta que compile un directorio y genere html, estaria bueno que se piense como libreria para que pueda ser utilizado por brackets para hacer un plugin, o tal vez ser incluido por un web server hecho con express, para que la documentacion sea realmente dinamica, y que responda ajax, o dios sabe que.  O tal vez la herramienta que genera el html le queda insuficiente a quien la use, y quiera generarse la suya, pero le guste el parser de md, o la resolucion de conflictos. Otra cosa en utilizable como libreria, es que pueda ser usada en conjunto con otras librerias como dox para incluir JSDoc, etc.


### Self used
{: #self-used}

One of the main ideas to keep is that it should be self used. That is, the documentation of this tool should be built using the tool itself.

I hope most of the features, will arise from this process.

### Unopinionated
Eventualmente la idea seria hacer un plugin para brackets, pero lo que brackets te facilite, tiene que poder hacerse en texto plano.

Podes construir distintos tipos de documentacion.

y por eso se hizo el template system y la estructura de directorios.

si quiero que sea un blog, puedo agarrar un plugin de facebook de comentarios y se convierte en un blog.

Si quiero que sea una documentacion mas dinamica, puedo hacer que sea una SPA hecha con Angular.js

### Extensible
Que puedas crear plugin de brackets, codigo browseable, o lo que quieras
unopinionated va de la mano con extensible.

### Non intrusive


De la documentacion al codigo

Your source code should be beutiful by itself, and it should stay that way. I love for example how Brackets present their documentation, they
are a text procesor developed with HTML, and their documentation is a clean and readable HTML file that should be read by source code, not by rendering it.

Cada ida te puede dar features distintos. De la documentacion al codigo podes hacer que los snippets incluidos esten siempre refrescados, y podes llegar a saber si el documento esta actualizado o no.

La idea es no modificar los habitos de programación. Que organices tu codigo y los comentarios inline de la manera que siempre lo harias.


Se puede llegar a inferir la vuelta, para herramientas como bracket o incluso para mostrar el codigo anotado de una manera piola, tipo docco. Pero es la documentacion la que se tiene que adaptar a eso, a lo sumo poniendo en codigo referencias cortas como

    // @someref


### QUE SEA SIMPLE?
Es un poco el concepto de los flat files
Pareceria estar entongado con extensible, unopinado y no intrusive

### que cualquier cosa que se pueda hacer con una extension, la pueda hacer un humano.
### HUMAN READABLE

### minimalistic, but not for now
quiero que sea la minima expresion, y por eso sea eventualmente minimalista. Pero en un principio es mas facil poner todo en la misma bolsa de gatos e ir subdividiendo despues. Por ejemplo, planeo poner lo antes posible la grunt task, adentro del proyecto, pero esto suena que eventualmente ira en un proyecto externo.
