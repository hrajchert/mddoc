### WARNING!!!
Hey, so... you are not supposed to see this. If you are, that probably means that you have traveled back in time with the help of the git commit log and you are seeing this somehow... If so, kudos! but be warned, this are my unprocesed thoughts in spanish, and I thought it might be a good idea to commit them anyway so I can rest assured that in the process of translation and text refactoring nothing gets lost.

### Spanish unformatted

Esto va con non intrusive, pero la idea es que si quiero que sea un blog, puedo agarrar un plugin de facebook de comentarios y se convierte en un blog.

Si quiero que sea una documentacion mas dinamica, puedo hacer que sea una SPA hecha con Angular.js

En este momento estoy escribiendo el blog, porque me parece una buena forma de documentar que es poco usual. Las ventajas que tiene un blog es que no va cambiando con el tiempo. Esto quiere decir, si yo hago una entrada en el blog que explica al momento, porque tome X decision, esa explicacion queda congelada en el tiempo y no se desactualiza, aunque despues la decision X se revierta.
Seria de esperar que lo que se ponga en el blog se vea copiado, pegado y modificado en la documentacion top-down, que seria la que deberia representar el estado actual del producto, pero el blog no muta, no queda desactualizado. A lo sumo puede pasar que algo que podria ser blogeado, por paja, no lo sea, hence, mala documentacion.


me gusta que el blog sea desestructurado, y no sea un producto completo. Para eso esta la documentacion top-down. Si bien hay algun grado de correcion para que no sea un mumble jumble. La idea del blog es que sea una bajada mas directa de lo que estoy pensando. Por eso lo escribo en español y cuando lo traduzco al ingles, lleva su unico "curado". Cuando quice ver como llamaba esta seccion, busque la traduccion de la palabra en español "Bitacora", en referencia a la "Bitacora del capitan" y vi que era Blog. Pero eso me hizo cuestionar esto. Por que el Blog tecnológico, como estoy más acostumbrado, esta mas orientado a articulos que a Bitacoras.

Entonces el Blog es una historia que cuenta como se desarrolla el producto.

* Da paja las herramientas que tenemos para documentar, JSDoc, docco.
Las herramientas no estan unidas. Puedo hacer un blog con wordpress desde antes, pero de alli a poder poner un codigo inmutable (feature!) que haga un vinculo esporadico al codigo, es otra cosa. Ojo, puede ser que esta herramienta incluya o no cosas como las de JSDoc o docco, pero si que incluya la forma en que el usuario final las use.

* Da paja el documentar en si. Top down, inline, Blog. Desincronizacion de la documentacion al codigo o al producto en si. El tener que procesar y formatear la documentacion.

Documentar da mucho trabajo en si, el saber que escribo, como lo escribo y donde lo pongo. Cuantos ejemplos, cuanto texto. De por si todo es documentacion. Los issue de github se podria decir que son documentacion, que deberia ser referenciada desde el top-down.


Me gustaria que eventualmente esto se use mas como un concepto que como una herramienta, y sea independiente del lenguaje, pero en este momento, tiene que estar ligado a un lenguaje de programacion, y en este momento ese lenguaje es javascript. Por un lado, porque es el lenguaje en el que estoy programando en esta etapa. Pero por otro lado, como ya fue predicho, yo creo que las herramientas web son el futuro, el unificar los conocimientos. Brackets, Angular.js, phonegap y muchos otros me muestran que el camino de la inovacion es web, y parece faltar mucho tiempo hasta que Javascript sea destronado por un lenguaje mejor.

No me gusta que docco te imponga una forma de documentar, y que hagas que tengas que cambiar tu codigo para que la documentacion sea correcta. Un codigo bien documentado, es el que esta bien programado y casi que se entiende solo, entonces con un par de inline codes se entiende. Si se require mas, esta bueno poder complementarlo, con historia de como fue creado, toma de decisiones, bugs que lo afectaron, lo que sea. Lo que se complica entonces, es el poder dar un punto de entrada a este mundo de documentacion, y el hecho de que lo que esta documentado sea pertinente, osea que este actualizado.

El punto de entrada me gusta dejarselo a cada desarrollador, que juege con eso. Por eso pongo un template system. Para dar total libertad, si te gusta en forma de historia inmutable, un blog puede ser una buena idea. Si queres ir mezclando logs de commit, entradas a github (issues, pull request, comentarios de codigo), que asi sea. Queda en cada uno ver que es lo mas util para que despues el usuario pueda usar con exito el producto. Y mas aun, la idea de esto es facilitarle un poco la vida al usuario. Esta bueno que puedan entrar a la documentacion y en un tiempo corto poder hacer algo util, y eso tiene que estar siempre sincronizado. Si alguien esta leyendo esta entrada de blog, puede que no entienda mucho mas del codigo mas que de las razones que me llevaron a escribir esta herramienta.

El otro problema, de lo pertinente o sincronizado, es donde esta herramienta va a tratar de minimizar un poco el dolor de huevos. No se hasta donde llegara, pero me parece interesante ver si se puede hacer por ejemplo un plugin de brackets que te de una union mayor entre el codigo y la documentacion, mostrandote por ejemplo que codigo esta documentado por que md. Y que te permita modificar el markdown desde alli si es necesario (asi como hacen con el css). Me gustaria que el proceso de documentacion este dentro de una tarea de grunt, con un watch, y que si la modificacion del codigo altera un codigo referenciado, te lo avise, y guarde la advertencia, para que sepas que tal vez, la documentacion ya no es pertinente, o haya que actualizarla, y que tal vez vos puedas indicar de alguna manera si, el cambio no afecto la documentacion, carry on. O tal vez si la cambio y quede para ser actualizada despues. O que ya la actualizaste entonces hurray!
En ese sentido, creo que el como se referencia la documentacion es importante, porque decir `archivo.js:11-15` es mas volatil que decir la funcion `myFunc`. O tal vez incluso dar una regexp de texto a buscar y el bloque logico padre mas cercano a referenciar usando esta herramienta de AST del lenguaje.
De eso estaria lindo que busque una regexp, diga el padre Bloque, If, Function File, nose... y algun numerador con default sensible, entonces por ejemplo, si decis que hay una ocurrencia, si encuentra dos en la regexp, la herramienta tira warning, e incluso puede ser causa de desactualizacion. Pero puedas indicar tal vez que hay 4 referencias y que las queres todas!

Las referencias en si, me gustaria que sea como sea la query, el resultado sea principalmente texto que pueda ser insertado, y posiblemente un pedazo de AST. Con el texto que puede ser insertado, se puede aplicar un hash y ver en una segunda pasada si el hash es distinto, entonces hacer el warning de codigo cambiado. Eventualmente, esto se puede enriquecer con el parcial de AST, porque tal vez el cambio fue en un comentario, o alguna otra cosa inocua, entonces se podria evitar el warning (bastante mas avanzado)

En un principio, intuyo que voy a terminar guardando lo que me devuelva el parser en algun archivo json que tal vez este comiteado. Estaba pensando el otro dia que podriiiia no ser necesario tenerlo comiteado, porque en el eventual, se podria regenerar de las versiones anteriores de git, pero eso suena muy avanzado para unas primeras etapas. Si tiene que estar fisicamente en algun lado para poder ver la diferencia entre las versiones anteriores y la actual, y poder decir si se desactualizo o no.

La parte de que ese archivo este comiteado, es por dos razones, por un lado, el historico, que por ahora mucho no pesa, y por el otro, por el compartido, ese si. Si el programador A crea documentacion que referencia codigo, lo compila y lo comitea, el desarrollador b puede ser que agarre el codigo, modifique, compile y no se de cuenta que quedo desactualizada. Entonces, o se comitea el archivo json encargado de mantener las referencias, o se agrega en las referencias un extra, que seria a que commit corresponde, lo cual implicaria ademas, que solo se pueda referenciar a codigo ya comiteado y mas aun, que el proyecto este medio que cableado a git, lo cual no me gusta.

En este momento veo un par de tipos de referencia. Por un lado, estan las referencias que incluyen codigo (includecode), y las referencias que solo apuntan (coderef). Despues, la conotacion que cada referencia tiene, puede ser dada por una clase css que se le de, y como el documentador la utiliza en su codigo. Por ejemplo, se puede poner que un include code sea un ejemplo de uso, o simple referencia, y eso se vea y actue distinto.

Estaria bueno poder ofrecer la posibilidad de extender la sintaxis o el componente web, para que se puedan crear cosas como un tab de referencias, asi como tiene la documentacion de doctrine.

Por otro lado, habra que ver los bloques de codigo vs referencias inline?. Me parece en un principio que seria deseable poder referenciar un parrafo, o una seccion a un codigo.

Otra cosa que me parece que puede funcionar es que dentro de un mismo markdown, se defina en algun lado la referencia al codigo y que se le pueda dar un nombre, asi en varias partes se pueda decir que tal cosa lo referencia.

Por ahora veo un par de partes de como se puede separar esto. Por un lado hay un parser de los markdown, que se encarga de leer los archivos de ese formato, y generar las referencias al codigo que despues voy a requerir. Actualmente eso se genera con un JsonML. Me falta definir alguna otra salida, en la cual yo me pueda quedar con las referencias, que codigo, de que linea a que linea, que parte del AST, que hash tenia, e incluso guardar el codigo a copiar.

Actualmente entre el JsonML parseado y el render, hay un paso intermedio que es de insertado de codigo. Eventualmente alli tmb se meteria de alguna manera el resolutor de conflictos.

Por otro lado, tiene que haber un render, que si bien por ahora esta enganchado al template system, y a html en si, podria terminar siendo latex o dios sabe que.

Un resolutor de conflictos. Estaria bueno poder definir varios tipos de detectores de conflicto que sean activables segun corresponda. Detector simple for hash, detector de AST, detector con diff.

El proyecto estaria bueno que sea "utilizable como libreria". Entonces, si bien va a haber algun tipo de herramienta que compile un directorio y genere html, estaria bueno que se piense como libreria para que pueda ser utilizado por brackets para hacer un plugin, o tal vez ser incluido por un web server hecho con express, para que la documentacion sea realmente dinamica, y que responda ajax, o dios sabe que. Un posible output que veo del proyecto, es hacer un navegador de codigo interactivo, eso por ejemplo suena que podria ser una aplicacion de angular con llamadas REST. O tal vez la herramienta que genera el html le queda insuficiente a quien la use, y quiera generarse la suya, pero le guste el parser de md, o la resolucion de conflictos. Otra cosa en utilizable como libreria, es que pueda ser usada en conjunto con otras librerias como dox para incluir JSDoc, etc.

La resolucion de conflictos podria incluir, de haber una manera facil, el uso de los diff, para saber si tal vez solo hay una corrida de lineas. Eso implicaria otra vez, o guardar el archivo entero referenciado ( puede estar comprimido). O guardar una referencia a un commit de git, pero eso trae los problemas que dije antes. O a lo mejor, la mezcla de dos mundos. Si esta comiteado, usar la referencia, si no, usar el gziped. E incluso talvez, dar la opcion de no usar esto, y de todos los conflictos detectables, usar el que se pueda sin guardar el archivo en si.

Quiero guardar el codigo referenciado por varios motivos. En una primera intuicion, yo creo que no se tiene que actualizar en la documentacion si hay cambio y no esta resuelto el conflicto. En las entradas de blog, el poner como nofix, podria hacer que yo pueda tranquilamente hacer una referencia de codigo y saber que despues, aunque haya conflicto, no se deberia tocar, ya que el blog es inmutable. De ultima, estaria bueno ver como hacer con la dimension de git, para que las referencias sean sobre un codigo comiteado, y que eso siempre este.

La introduccion de git me podria dar una dimension de tiempo en el desarrollo. Ver como la documentacion referenciaba a un codigo en algun momento, y ver como eso fue cambiando. Pero eso, se ve como que es para mucho mas adelante, y requiere mas pensamiento.

Estoy tratando de definir unos guidelines que lleven el desarrollo del proyecto, y en la medida de lo posible, me gustaria que cada commit sea una declaración para fortalecer esos guidelines. De esa manera, el primer commit se focalizo en hacer que la herramienta pueda ser utilizada en si misma, y eso perdura para los siguientes commit, en el segundo commit, la idea es de dar mayor libertad al documentador, y por eso se hizo el template system y la estructura de directorios.

La idea es ir perfeccionado tanto el codigo, como la documentacion, como la vida!. Pero hay una realidad, es mas facil hacer las cosas destructuradamente, da mas felicidad al hacerlo, y mas libertad. Pero resulta siendo menos util. En estos primeros commits esta todo dentro de un archivo, y mientras escribo este blog, esta todo en un archivo de una forma sin estructura previa. Pero porque eso me permite a mi desarrollar o documentar mas libremente y con mas pasion. Si tengo que pensar donde poner las cosas, o como escribirlas, parte del proceso mental que deberia encargarse de que decir se pierde. Pero hay que refactorear, porque es lo que me permite que la documentacion sea legible, y que el codigo sea reutilizable o extensible.

En el momento que escribo esto (tanto el codigo como el blog), estoy en una etapa de la vida con bastante incertidumbre, y no se en que termine o si alguien terminará leyendo esto. Si lo leen, manden un mensaje :)

A diferencia de lo que vi de Docco, que te da unos templates que pueden ser utilizados, te da unos por default y te muestra como crear otros y que vos podes poner al llamar a la libreria cual queres que use. Tengo pensado que el template aqui, lo haga el usuario, a lo sumo copiando y pegando de unos posibles ejemplos que haga. De eso el que sea usado como libreria mas que como herramienta.

Yo en general me suelo trabar con si algo es eficiente o no. Por ejemplo, para este segundo commit, tuve que hacer un walk de un directorio, y lo termine haciendo con promesas. Tranquilamente podria haber copiado y pegado la [respuesta en stackoverflow que vi al respecto](http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search), o utilizar alguna libreria que lo haga, pero decidi hacer mi propia version sabiendo que probablemente no sea la mas eficiente. Por un lado, se que la puedo cambiar en el futuro, osea, mejor sacara algo poco performante hoy, que hacerce el coco y no sacar nada. Por otro lado, tengo total control, cosa que al usar una libreria tal vez no lo tendria. Diferente es la decision de porque use la libreria de markdown que use. Termine aprendiendo, o reenforzando binding para casos especiales, y promesas tmb.
Mientras desarrollaba tuve un bug que me costo descular, que tenia que ver a como funciona el binding. Tenia definido la funcion de el statusHandler en el for (lo cual ya es malo) y encima, el i y el filename quedaban asociados al ultimo valor, entonces para el caso que tenia, se trataba de acceder al elemento 5 del array, que era un elemento no valido. Termine creando un object literal, y bindeando el handler del status a el. Esto probablemente resulta en poca performance, porque tengo promesas por doquier y bindings tmb. Pero como esto no es para algo live, sino que es una herramienta, esa es una performance que me puedo dar el lujo de malgastar. Si tarda 5 minutos en crearse la documentacion de un proyecto grande, bueeeno, era un proyecto grande!. Eventualmente se podra trabajar en eso :D.

Estaria bueno que en un blog pueda hacer una referencia nofix, pero tal vez tmb estaria bueno que se pueda ir adaptando de alguna manera, porque en los blogs suena como un lugar copado para escribir decisiones tomadas (o tal vez una seccion llamada asi). Y sea donde este, podria estar bueno que eso quede representado, mas que nada para que si estoy en brackets, sea como una buena documentacion de porque algo esta asi.
En un principio veo que entre la diferencia entre la seccion y el blog para este uso. Ya dijimos que el blog es casi inmutable, osea que si el codigo que tenia una referencia inversa de decision de uso ya no existe, muuucho drama no te haces, ya que el blog es historico. Eso va en contrario a tener una seccion de decisiones de codigo. Que tal vez es linda de tener, pero tenes que estar manejando que no se desactualize.

Referencia en un blog que no termine de ser nofix, que sea una explicacion de porque hice tal cosa, como lo que acabo de explicar de la performance

Estaria bueno que en el render pueda aparecer mediante una clase css o algo (metadata de la referencia) el status de si la referencia esta actualizada o no.





La mente es destructurada, se habla de mapeo mental, el ver que tenes en la cabeza en un momento X. La metodologia top-down es estructurada y esta pensada para que al lector le sea mas facil adoptar los conocimientos. El mapeo mental es mas facil de bajar, pero mas dificil de leer. El mapeo mental se siente mas honesto que el top-down


##Estructurado
* Tutorial
* toma de decisiones
* manual de uso

## Miti y miti
* codigo anotado
* jsdoc

## Desectructurado
* blog


Es muy dificil armar algo estructurado de una, es mas facil poder partir de algo desectructurado pero flexible e ir cerrando las ideas y poniendolas en el lugar correcto. Es probable que ese lugar vaya cambiando, mientras las ideas evolucionan.
En el lado contrario, una vez que tenes mucha cosa destructurada, es probable que despues de paja el estructurarlo, mas cuando esta estructurado a la mitad y queda obsoleto. En ese sentido esta piola cuando se lleva algo destructurado al maximo y donde la estructura empieza a emerger como una necesidad obvia y no de antemano. Si bien el dolor mental sea el mismo, lo que causa que no se termine de estructurar.








Veo que hay 3 puntos de toque humano donde el desarrollador podria tocar. Con un 4to punto medio virtual.

* La documentacion
* La metadata
* Las extensiones de la libreria

y el cuarto vendria a ser el codigo.

La idea es que cada uno de ellos pueda ser intervenido por una persona, osea que tiene que ser human readable.
Por eso la documentacion es markdown. Por un lado por que esta de moda, por el otro porque esta orientado a ser human readable, y es relativamente facil de ser extendida, de hecho, ya lo hice

Tenia ganas de hablar de como se puede tocar la metadata en si, y la estructura, y los problemas, la rigidez, etc. Que pasa si cambio la documentacion? el programa deberia ser robusto a ello, pero un poco es formal. La diferencia entre lo humano y lo maquina. Esta en un punto intermedio, porque si queres que se ponga una clase css que haga que la pagina haga algo en particular, le tenes que imponer un formato que de ser cambiado podria afectar el resultado, generando una especie de "bug en la documentacion". La metadata es mas sensible, creo que estaria mas para que un humano la pueda leer, pero no necesariamente la tenga que tocar. Igual quiero que este en json, y separada en distintos archivos dentro de un directorio "oculto".

La idea es minimizar el daño que pueda hacer un usuario al tocar uno de estos archivos, y mas si estan comiteados, que no haya conflictos de merge, o que hasta puedan ser solucionados por una persona. Si bien habria que o poder regenerar, o darle al usuario una herramienta uqe haga diff de metadata.

Otra cosa, la metadata de los archivos, si esta gziped, casi que te diria que tendria que estar en un archivo separado. O a lo sumo un gziped de todas las inclusiones de codigo, eso hasta podria ser eficiente en el zip mismo, por como funcionan los zip de texto.


el cuarto lo puse asi porque la idea es que no se tenga que modificar, a lo sumo un // @ref, pero voy a tratar de evitar que eso pase en lo posible



# 19 Nov 2013
Hoy estaba pensando sobre el tema de los refhash y refid. Me surgio en varios momentos la necesidad de identificar una referencia. Por un lado
para el proceso de saber si una referencia esta desactualizada, y en otros casos, por tema de acceso y de referencia en si.
El de si esta desactualizada esta bastante claro, para saber si una referencia esta desactualizada, me tengo que fijar si la referencia es la misma y si el codigo al que referencia cambio, en eso, esta la primera parte.

De la otra tengo un par de cosas que ya pasaron, y otras que siento que van a pasar. Por ejemplo, en esta primera etapa, manejo las referencias en el `hrMd` como un array de referencias, y en el codigo como un hashmap de referencias. Por temas de acceso y de performance, guardo en memoria
unas refencias privadas que no son bajada a la metadata. Por ejemplo, la referencia tiene un link al nodo jsonml que genero esa referencia. De este modo, cuando hago el code include, no necesito generar todo el jsonml de vuelta, ni nada por el estilo. Hago lo mismo cuando genero el LOC
 de hrCode, mas que nada porque no quiero iterar el array de referencias del hrMd (aunque no sea muy pesado).

 La parte que recuerdo de porque en `hrMd` puse un array en vez de un map, es que para id de una referencia, solo se me ocurria el hash md5 del contenido de la referencia en si. Y que eso podria no ser muy bueno, porque puede haber dos referencias con el mismo contenido, pero que no sean la misma referencia, o dos referencias que sean la misma, pero con distinto hash. Alli entra un poco el tema del nombre de una referencia.

 Por un lado, dos referencias que tienen el mismo nombre, deberian ser la misma referencia, y el usuario tendria que cuidarse de que no colisionen (con warnings desde la herramienta). Pero no quiero obligar al usuario a tener que generar un nombre para la referencia si no quiere.

 El problema se complica un poco mas, cuando entra en juego el hecho de que podes nombrar una referencia y despues usar el link nomas, ya sea para generar una sub referencia, o la misma en si. Por ejemplo, si tenes en un md

    {%code_ref
        "name" : "myref",
        "src" : "..."
        "ref" : {...}
    %}

Es la definicion de la referencia "myref", mientras que

    {%code_ref
        "name" : "myref"
    %}

o

    <%code_ref myref %>

Serian una forma practica de decir, aca tambien referencio al mismo codigo. Esto lo habia traido como idea por un lado para que si tengo varios
puntos donde hablo de lo mismo, no tenga que reescribir la misma referencia en todos lados. Y mas aun, se me habia ocurrido hacer algo como
esto (o una variacion)

    {%code_ref
        "name" : "myref",
        "filter" : {
            "include" : "blah",
            "exclude" : "blah"
        }
    %}

Como forma de hacer una sub referencia, y tal vez explicar un codigo poniendo includes parciales, donde digo la funcion XXX tiene 3 partes, la parte 1 hace esto, la parte 2 aquello, y la 3 blah. El tema de los filtros es casi independiente de si reutilizo la misma referencia o no. Tal vez usando un parent en vez de un name, ya que esto trae a la pregunta: Una subreferencia, es una referencia nueva, o sigue siendo parte de la
otra referencia? Y mas aun, importa esto? Para mostrar que hubo una colision? Para guardar el snippet y mostrarlo? A lo sumo en este ultimo, donde
claramente el snippet seria distinto.

Parecido a este concepto, se me habia ocurrido tener como templates de referencia, y el tema de parent, podria hacer que use como template a la referencia padre y esta sea realmente una nueva referencia, y mas aun, se puedan usar cosas como

    {%blog_ref
        "src" : "...",
        "ref" : {...}
    %}

Como forma de no tener que pasar como opcion el no quejarse, y como buena forma de extension. Ya que en la referencia, al ser un Object Literal, se encuentran las opciones de la misma, atributos CSS, etc. Y tal vez para no escribir todas las opciones, el poder cambiar de nombre de referencia como que template usar, pareceria una buena idea. Otras opciones que se me ocurrieron es, que renderer usar, etc.

Viendo todo esto, en el viaje en bici se me habia ocurrido diferenciar del refhash y un posible refid y el refname. Y ver que reglas ponerle a cada uno.

El refhash pareceria ser entonces un hash md5 de el texto de la referencia o del objecto ref en si, y tengo que ver los pros y contras de eso. En un principio implemente lo del texto, pero todo sugiere que tiene mas sentido del objeto. Ya que si cambio el template, va a haber cosas que no estan escritas, pero que influyen en decir, la referencia es la misma. Este es el sentido del refhash, ver si la referencia es la misma. En ese sentido, si tengo una named reference (le tengo que buscar otro nombre), y expando la referencia a su object literal, el hash del objeto deberia ser el mismo, por ende la referencia igual.

Por otro lado esta el id, que intuyo en un principio, deberia ser unico por referencia, y eso incluye el uso de named reference. Si en un lugar defino la referencia `myref` y en otro lado la uso, cada una de esas referencias deberia tener un id distinto.