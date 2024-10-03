Walkdir gives the full path for each file so I have to remove the input dir part.

{%code_ref
    "src" : "src/markdown-parser/markdown-reader.ts",
    "ref" : {
        "text" : "file.substr(dirNameLength + 1).match(mdre)"
    }
%}

**Warning:**
I don't like the fact that this is here, its implying that it has 1-1 relation with the metadata saved
{:.alert .alert-danger }

{%code_warning
    "src" : "src/markdown-parser/markdown-file-reader.ts",
    "ref" : {
        "text" : "Object.defineProperty(ref, \"jsonml\", { enumerable: false });"
    }
%}




Improve the error handling when the block is not valid JSON

{%code_todo
    "src" : "src/markdown-parser/markdown-file-reader.ts",
    "priority" : 3,
    "ref" : {
        "text" : "const attr = JSON.parse"
    }
%}
