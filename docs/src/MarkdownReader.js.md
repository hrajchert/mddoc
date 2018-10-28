Walkdir gives the full path for each file so I have to remove the input dir part. RECONECTAR

{ % code_ref
    "src" : "src/MarkdownReader.js",
    "ref" : {
        "text" : "var match = files[i].substr(dirNameLength+1).match(mdre);"
    }
%}

**Warning:**
I don't like the fact that this is here, its implying that it has 1-1 relation with the metadata saved
{:.alert .alert-danger } RECONECTAR

{ % code_warning
    "src" : "src/MarkdownReader.js",
    "ref" : {
        "text" : "Object.defineProperty(ref,\"jsonml\",{enumerable:false});"
    }
%}



**Warning:**
Revisit this
{:.alert .alert-danger }

{ % code_warning
    "src" : "src/MarkdownReader.js",
    "ref" : {
        "text" : "MarkdownReader.prototype.analyzeMarkdownFileReader"
    }
%}


Improve the error handling when the block is not valid JSON RECONECTAR

{ % code_todo
    "src" : "src/MarkdownReader.js",
    "priority" : 3,
    "ref" : {
        "text" : "var attr = JSON.parse"
    }
%}
