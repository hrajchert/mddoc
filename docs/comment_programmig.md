Eventually this will be separated between library and application, for now they are together for simplicity.
The library will be in charge of generating and interpreting the metadata

For now the tool part should have a flow like this

1. Leer la configuracion
1. Generar la metadata
1. Avisar los conflictos?
1. Remplazar las inclusiones
1. Generar html

el Generar la metadata es lo que hace la libreria y esta compuesto de:

1. Leer los markdown
1. Leer el codigo
1. Leer la metadata anterior
1. Salvar / Swapear la metadata

Leer los markdown a su vez se divide en

1. Parsear los markdown
1. Interpretar los JsonML

en la interpretacion del JsonML se construye una intencion de leer archivos de codigo

En principio hablo de swapear la metadata y de leer la metadata anterior porque siento que la generacion de la documentacion
debe ser un proceso "comiteable". Pero con un concepto de comit mas arriba que el comit the git/svn. Me gustaria en principio que cada vez que se corra la documentacion se genere en un lugar temporal, y solo si se corre como `documentor --save` o algo asi, se salve la metadata y se empieze a fijar el tema de los cambios.


Deberia poder regenerar la documentación solamente leyendo la metadata? Osea, sin releer ni los archivos ni el codigo.
> Por un lado suena interesante como concepto, pero trae como problema que tendria que guardar el JsonML como metadata tmb, cosa que no quiero hacer. Si no guardo el JsonML tendria que estar fijandome si el archivo en el cual estoy basado, cambio o no. Osea, en un principio parece que no.


Acordarse de guardar por archivo el hash del archivo para ver si tiene que volverse a procesar o no.






## Read the configuration
The configuration is a json file that holds the options for rendering the documentation
There will be a configuration merge between defaults, user configuration, command line arguments

## parse markdowns:

This will create a JsonML from all the markdowns in the `inputDir` folder. Inside I will have standard JsonML elements,
and the custom ones I'll create for referencing


## build metadata
crear una estructura intermedia donde interprete las referencias. En principio en esta etapa no deberia hacer el replace de los includes, sino mantener una referencia a cual nodo es para referir, y cual es para incluir. Parte de interpretar las diferencias va a ser el leer la descripcion y obtener el snippet de codigo y un eventual nodo AST.

Este paso intermedio creo que puede generar el Arbol de metadata y como un arbol de lectura. Si es que el arbol de metadata no incluye a ambos. Creo en principio que si los incluiria.

El arbol de metadata podria tener entonces informacion de los markdowns, e informacion del codigo, como dos grandes ramas. Las dos informaciones la saca de los markdowns en si, pero, la del codigo va a ser utilizada por ejemplo, para leer una sola vez cada archivo (y ejecutar esprima una sola vez), en vez de hacerlo cada vez que se encuentre una referencia. Despues la metadata puede ser usada para los otros tools.


### interpret markdown
Aca es donde creo la primera etapa de hrMd

## Change detector

hacer el change detector comparando la ultima metadata y esta metadata. Aca tengo que descular un poco el asunto de la metadata, porque la idea no es crear el "arbol json de metadata" desde cero, sino que hay parte que si, y parte que es incremental. Todavia no se cual.


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

The template system and the eventual application that resolve REST calls from a possible angular.js application should receive a mix of the metadata itself (or a way to read a single or multiple files at once), and some helper closures that can help in the interpretation of the package.

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
                "type" : "include/reference"
                "ref" : {
                    // whatever the user has introduced directly
                    "line" : "3-4"
                }

                "char" : {
                    "from" : 45,
                    "to" : 49
                },
                "refhash" : "SDG@#E!SCVB",
                "codehash" : "ASDF@#@$432D",
                "status" : "resolved?pending?outdated?...."
            },
            {
                // ...
            }
        ]
    }

This metadata will be constructed in two turns, when interpreting the markdown itself, and after each src file is "harvested".

#### Ref

##### name

Optional name of the reference. This is useful in a couple of ways. For one part, when writting your markdowns, you may want to repeat a reference but you don't want to repeat the code to reference it, which is cumbersome and as a bonus, this way you can update all your references to that code in one place. For other part, it can reduce the amount of metadata that is generated, because we are not going to do snippet optimization to see if two refs are equal, or something along those lines.

I have to figure out if I want this name to be global or not. In principle I think it could be a global name, but
if the name starts with _ its local to the file.

####

The code ref char object will be either provider or created after the source is read.


Como me doy cuenta si una referencia esta desactualizada?

> Una referencia esta desactualizada si la referencia no cambia, y el codigo al que referencia si. El codigo referenciado
> se puede ver si cambia o no por el hash del snippet o por una comparacion del arbol AST

Como me doy cuenta si una referencia es la misma?
> En principio haciendole un hash al termino de referencia en si.

Utilizo el nombre de la referencia o solo la parte ref?
> En principio me veo tentado a usar el nombre de la referencia, pero parte de mi instinto me dice que no es necesario. Una referencia es igual a otra si el hash de la busqueda es el mismo, pero si la referencia queda desactualizada, la forma de sincronizarlo es cambiando la forma de buscar, lo cual haria que la referencia ya no sea la misma de antes.

Que pasa si el proyecto es muy grande? todo en memoria o que?
> Por ahora intuyo que la metadata deberia estar en memoria, y serializarse a un archivo, mas que nada por "performance last". Pero suena que puede irse de mambo muy pronto. Performance last porque tenerlo en memoria es lo mas facil, y es dificil definir a priori si hay que hacer como alguna especie de swap, y con que granularidad.

Solo quiero notificar de desactualizacion una vez en el grunt, despues que aparezca en alguna pagina, o que el usuario de la libreria pueda pedir por las referencias desactualizadas



## Code Reader

The code reader receives a list of files to read and where those files should be read in the form of the `hrCode` metadata.

The code reader will process each file, one by one (or all at once, depends of memory and such).

For each code file to read, it will generate an AST, and try to find all references. It will then store in the `hrSnippets` metadata a copy of the relevant snippets and AST nodes.

For each code reference, the code reader will generate a character location inside the file, that will help future tools in showing up what parts of code is documented, and help select the correct AST node.

The code reader should also perform a hash on the snippet.


There are so far XX types of references

### Line number
This is somehow volatil, as any insertion or deletion prior to the referenced code will produce a desincronization.

### Plain text
You search for a literal text to find, and then you can navigate the AST up and down to get your node.

### Find regex
Same as plain text but with regular expressions.

