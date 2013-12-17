Walkdir gives the full path for each file so I have to remove the input dir part.

{%code_ref
    "src" : "src/MarkdownReader.js",
    "ref" : {
        "text" : "var match = files[i].substr(dirNameLength+1).match(mdre);"
    }
%}

For some reason I don't like having this repetitive information, that I initialy got from the doc to the code, inversed
in the code to doc. The reason that I do it, is that I need it in the brackets plugin to be able to put labels to the different
directives. For now the solution is to have it duplicated, but I should go in favor of either adding a helper that can get
the directive in O(1), or think if I really really need to have both hrCode and hrDoc.

{%code_todo
    "src" : "src/MarkdownReader.js",
    "ref" : {
        "text" : "\"directive\": ref.directive"
    }
%}

