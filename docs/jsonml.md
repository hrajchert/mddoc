# JsonML
The JsonML ([JSON Markup Language](http://www.jsonml.org/)) is a javascript structure that represents a parsed Markdown file.
We create it using the library [markdown-js](https://github.com/evilstreak/markdown-js), that allows us to extend the Markdown syntax.

TODO: Add a how to extend the markdown syntax.

The structure is stored in the metadata under the key `jsonml` in the method `MarkdownReader.prototype.parse`.

{%code_ref
    "src" : "src/MetadataManager.js",
    "ref" : {
        "text" : "meta.jsonml[mdFileReader.plainFileName] = mdFileReader.jsonml;"
    }
%}

