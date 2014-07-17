Eventually this will be separated between library and application, for now they are together for simplicity.
The library will be in charge of generating and interpreting the metadata.

{%code_todo
    "src" : "mddoc.js",
    "ref" : {
        "text" : "mddoc   = require("
    }
%}

For now the tool part should have a flow like this

1. Read the configuration *done*{: .done }
1. Generate the metadata  *almost*{: .almost-done }
1. Notify conflicts?      *not done*{: .not-done}
1. Replace includes       *done*{: .done }
1. Generate HTML          *done*{: .done }

the generation of the metadata is the responsability of the library and it means to:

1. Read the Markdowns         *done*{: .done }
1. Read the code              *done*{: .done }
1. Read old metadata          *not done*{: .not-done}
1. Save / Swap the metadata   *almost*{: .almost-done }

to read the Markdowns we need to

1. Parse the markdown         *done*{: .done }
1. Interpret the JsonML     *done*{: .done }

en la interpretacion del JsonML se construye una intencion de leer archivos de codigo

En principio hablo de swapear la metadata y de leer la metadata anterior porque siento que la **generacion** de la documentacion
debe ser un proceso "comiteable". Pero con un concepto de comit mas arriba que el comit the git/svn. Me gustaria en principio que cada
vez que se corra la documentacion se genere en un lugar temporal, y solo si se corre como `mddoc --save` o algo asi, se salve la metadata
y se empieze a fijar el tema de los cambios.


*Deberia poder regenerar la documentación solamente leyendo la metadata? Osea, sin releer ni los archivos ni el codigo?*{: .question}

Por un lado suena interesante como concepto, pero trae como problema que tendria que guardar el JsonML como metadata tmb, cosa que no quiero hacer.
Si no guardo el JsonML tendria que estar fijandome si el archivo en el cual estoy basado, cambio o no. Osea, en un principio parece que no.
{: .answer}

Acordarse de guardar por archivo el hash del archivo para ver si tiene que volverse a procesar o no.



## Read the configuration
The configuration is a json file that holds the options for rendering the documentation
There will be a configuration merge between defaults, user configuration, command line arguments

## parse markdowns:

This will create a JsonML from all the markdowns in the `inputDir` folder. Inside I will have standard JsonML elements,
and the custom ones I'll create for referencing


The class in charge of reading all the markdonws and generate the metadata from it is `MarkdownReader`. The method that walks into the `inputDir`
folder is `MarkdownReader.parse`

{%code_ref
    "src" : "src/MarkdownReader.js",
    "ref" : {
        "text" : "MarkdownReader.prototype.parse = function() {"
    }
%}

## build metadata
crear una estructura intermedia donde interprete las referencias. En principio en esta etapa no deberia hacer el replace de los includes, sino mantener
una referencia a cual nodo es para referir, y cual es para incluir. Parte de interpretar las diferencias va a ser el leer la descripcion y obtener el snippet
de codigo y un eventual nodo AST.

Este paso intermedio creo que puede generar el Arbol de metadata y como un arbol de lectura. Si es que el arbol de metadata no incluye a ambos. Creo en
principio que si los incluiria.

El arbol de metadata podria tener entonces informacion de los markdowns, e informacion del codigo, como dos grandes ramas. Las dos informaciones la saca
de los markdowns en si, pero, la del codigo va a ser utilizada por ejemplo, para leer una sola vez cada archivo (y ejecutar esprima una sola vez),
en vez de hacerlo cada vez que se encuentre una referencia. Despues la metadata puede ser usada para los otros tools.


### interpret markdown
Aca es donde creo la primera etapa de hrMd

## Change detector

hacer el change detector comparando la ultima metadata y esta metadata. Aca tengo que descular un poco el asunto de la metadata, porque la idea
no es crear el "arbol json de metadata" desde cero, sino que hay parte que si, y parte que es incremental. Todavia no se cual.


## replace code includes
## Render the documentation




coderef vs codeinc

## Metadata Structure

* `docs/`
* `dist/`
    * `.docu-meta/`
        * `index.json` // Points to the siblings
        * `hrMd/`
            * `index.json`
        * `hrCode/`
            * `index.json`
        * `hrSnippets.tar.gz` (/)
            * `index.json`
        * `xxYYYYY/`
            * `index.json`

Each index.json indicates the structure from that folder to all its childrens. It should probably reference the whole "medatada package".
Each package its started with a prefix indicating vendor (to avoid collitions) and then the name of the package.

The template system and the eventual application that resolve REST calls from a possible angular.js application should receive a mix of the metadata
itself (or a way to read a single or multiple files at once), and some helper closures that can help in the interpretation of the package.

Each json should have a documentor version number indicating with which version of the program/library, this metadata was made.

### hrMd
`hrMd/` will hold the metadata from the markdown perspective, its structure will be as follow.

* `hrMd/`
    * `index.json`
    * `file1.md.json`
    * `file2.md.json`
    * `somefolder/`
        * `file.3.md.json`

Each file `xxx.md.json` is the output of parsin the md file, and its json will be

    {
        "version": "0.0.1",
        "filehash" : "3dfF$345@SDF3",
        "refs" : [
            {
                "name": false,
                "src" : "src/app.js",
                "directive" : "code_ref/code_inc/code_warning/etc"
                "ref" : {
                    // whatever the user has introduced directly
                    "line" : "3-4"
                }

                "char" : {
                    "from" : 45,
                    "to" : 49
                },
                "refhash" : "SDG@#E!SCVB",
                "refline" : "5",
                "snippetHash" : "ASDF@#@$432D",
                "status" : "resolved?pending?outdated?...."
                "found" : true
            },
            {
                // ...
            }
        ]
    }

This metadata will be constructed in two turns, when interpreting the markdown itself, and after each src file is "harvested".

#### version
#### filehash

#### refs > name


Optional name of the reference. This is useful in a couple of ways. For one part, when writting your markdowns, you may want to repeat a reference
but you don't want to repeat the code to reference it, which is cumbersome and as a bonus, this way you can update all your references to that code
in one place. For other part, it can reduce the amount of metadata that is generated, because we are not going to do snippet optimization to see
if two refs are equal, or something along those lines.

I have to figure out if I want this name to be global or not. In principle I think it could be a global name, but
if the name starts with _ its local to the file.

#### refs > src
The source file that is being referenced.

Do I neeed to add something more than type to distinguish if the reference is only a named reference pointer? not the definition itself
{: .question}

The definition itself can/must be like a normal ref with a name on it. The other one should have like a status, if it was found or not, diferent of
the status of the reference itself. The status of the reference itself is to see if the reference is outdated or not, in this case (maybe using the
same field or not), the status should represent if the pointer was found or not. It should be something similar to a two pass.
{: .answer}

Algo me dice que tengo que probar si puedo guardar la referencia al jsonml para que despues sea mas facil el remplazo, pero hacerlo de una manera que no
se guarde en la metadata. Por ejemplo cuando busco las referencias, generar de alguna manera un hash table con key igual al hash de la referencia o
algo y value igual al jsonml, para luego hacer un facil remplazo. El hash este deberia ser un poco distinto, porque no deberia haber colisiones. Tal vez
mas que hash, hacer un src:line
#### refs > directive
It gives semantics to the reference, why are we refering to this code, is this a warning? a todo? do we want to include it? etc...
It will tell the rest of the library and tools how to render the ref, or how to treat it (in a tool).

#### refs > ref

This is the actual reference. So Far I see the following options:

* Line number
* Plain text
* Find regex

The ref can eventually have a resolver or type or something to indicate which code reader should be used.
Line number can be used with no problem with any type of files, but is quite limiting. Plain text and regex
can leverage on the fact we know the Javascript AST trough esprima, or cheerio (eventually). So you can put something like

    "ref" : {
        "resolver" : "esprima",
        "text" : "if (!mds.hasOwnProperty(mdTemplate)) {",
        "parent" : "BlockStatement",
        // "children": "...",
        "skip" : "something weird to navigate AST here"
    }

I would love to have a skip, so you can add `...` instead of the full code, and just skim the code.

#### refs > char
This is generated on a second turn, and its the char location in the source code of the referenced code.
Cannot remember why did I wanted here.

#### refs > refhash
The hash of the reference by itself, not the ref field, but the whole thing that goes inside the reference block. Its
an easy way to see if the reference has changed or not

#### refs > refline
The line number where this reference was found. Its a good way to point to the markup from a tool, or show
an error or conflict in the grunt task

#### refs > snippetHash
#### refs > status
#### refs > found
This indicates if the reference was found or not. I still have to figure it out how to relate with status.
In a first approach, I would say that found implies if it was found on this run or not, while status refers
to the conflict management.



## hrCode

    {
        "version" : "0.0.1",
        "filehash" : "!@#FFSF",
        "refs" : {
            "refhash@DSD#FG#" : {
                "loc" : [{"md":"...", "line":"..."}],
                "query" : {
                    ...
                },
                "found": true,
                "snippet" : "...",
                "snippetHash" : "@!SAFSDF"
            }
        }

    }

En principio si el key de los refs colisiona, no deberia haber problema, ya que es el refhash, y si coincide es porque es
la misma referencia. A lo sumo deberia tirar un warning de que se deberia unir bajo el mismo nombre.

The code ref char object will be either provider or created after the source is read.


Como me doy cuenta si una referencia esta desactualizada?
{: .question}

Una referencia esta desactualizada si la referencia no cambia, y el codigo al que referencia si. El codigo referenciado
se puede ver si cambia o no por el hash del snippet o por una comparacion del arbol AST
{: .answer}



Como me doy cuenta si una referencia es la misma?
{: .question}

En principio haciendole un hash al termino de referencia en si.
{: .answer}



Utilizo el nombre de la referencia o solo la parte ref?
{: .question}

En principio me veo tentado a usar el nombre de la referencia, pero parte de mi instinto me dice que no es necesario. Una referencia es igual a otra
si el hash de la busqueda es el mismo, pero si la referencia queda desactualizada, la forma de sincronizarlo es cambiando la forma de buscar, lo cual
haria que la referencia ya no sea la misma de antes.
{: .answer}



Que pasa si el proyecto es muy grande? todo en memoria o que?
{: .question}

Por ahora intuyo que la metadata deberia estar en memoria, y serializarse a un archivo, mas que nada por "performance last". Pero suena que puede
irse de mambo muy pronto. Performance last porque tenerlo en memoria es lo mas facil, y es dificil definir a priori si hay que hacer como alguna
especie de swap, y con que granularidad.
{: .answer}

Solo quiero notificar de desactualizacion una vez en el grunt, despues que aparezca en alguna pagina, o que el usuario de la libreria pueda pedir
por las referencias desactualizadas



## Code Reader

The code reader receives a list of files to read and where those files should be read in the form of the `hrCode` metadata.

The code reader will process each file, one by one (or all at once, depends of memory and such).

For each code file to read, it will generate an AST, and try to find all references. It will then store in the `hrSnippets` metadata a copy of the
relevant snippets and AST nodes.

**Warning:**
This is currently not like this doc says, we are storing the snippet in the `hrCode` reference. We should see if its worth to put in a separate object
or if is fine to leave it here.
{:.alert .alert-danger }

{%code_warning
    "src" : "src/MetadataManager.js",
    "ref" : {
        "text" : "hrCode.refs[refhash].snippet = snippet;"
    }
%}

For each code reference, the code reader will generate a character location inside the file, that will help future tools in showing up what parts
of code is documented, and help select the correct AST node.

The code reader should also perform a hash on the snippet.


There are so far XX types of references

### Line number
This is somehow volatil, as any insertion or deletion prior to the referenced code will produce a desincronization.

### Plain text
You search for a literal text to find, and then you can navigate the AST up and down to get your node.

### Find regex
Same as plain text but with regular expressions.

> Creo que hay que poner algo al respecto del AST reader para otros lenguajes. Si es html se puede usar el dom con cheerio, ver que onda
con otros lenguajes.


Como hago el remplazo de codigo?
{: .question}

Pareceria pertenecer a la etapa del render.
Requiero tener una lista de jsonml, los snippets ya cargados y las diferencias calculadas.
En caso de solo querer saber las diferencias, ni se haria esta etapa. Cuando me piden hacer el renderHtml de un markdown, me fijo en que
referencias hay, y la referencia guarda un vinculo al jsonML, en ese momento, con todo ya cargado, lo unico que tengo que hacer es
el replace.
Si hay una diferencia entre codigo viejo y actual, yo tengo que mostrar el viejo hasta que se marque una resolucion
{: .answer}


**Warning:**
Releer la pregunta de arriba porque sigue teniendo conceptos interesantes, y poner links a donde se hace esto. Agregar como info tmb
que tal vez estaria bueno tener diferentes renders de directivas, cosa de que cada generator pueda representar una directiva de una manera
distinta, en especial si en algun momento se cambia de html a otro formato
{:.alert .alert-danger }



Para que me sirve guardar un ref pointer en hrCode y para que en hrMd
{: .question}

en hrCode para las herramientas tipo code viewer, que requiero ver todos los lugares donde un codigo es referenciado. Solo lo marco como
LOC.
en hrMd para hacer la inclusion o referencia en si
{: .answer}


Que deberia imprimir cuando es solo una referencia?, sin inclusion
{: .question}

Cuando tiene inclusion, lo remplazo por un bloque codigo y ya.
Con solo una referencia, me tiento a decir que poner un span vacio con una clase. Tal vez estaria piola poder definir de alguna manera
como queres que sea remplazado, inyectando tu propio replacer, y poder poner por ejemplo, un link a un code viewer con linea y codigo.
{: .answer}

No se si ya lo puse en otro lado, pero queria recordarme que quiero guardar hash como clases css para hacer referencias en el html

Tener en cuenta esto para hacer diffs
https://github.com/kpdecker/jsdiff
