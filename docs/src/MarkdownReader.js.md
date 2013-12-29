Walkdir gives the full path for each file so I have to remove the input dir part.

{%code_ref
    "src" : "src/MarkdownReader.js",
    "ref" : {
        "text" : "var match = files[i].substr(dirNameLength+1).match(mdre);"
    }
%}

