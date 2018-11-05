**Warning:**

For some reason I don't like having this repetitive information, that I initialy got from the doc to the code, inversed
in the code to doc. The reason that I do it, is that I need it in the brackets plugin to be able to put labels to the different
directives. For now the solution is to have it duplicated, but I should go in favor of either adding a helper that can get
the directive in O(1), or think if I really really need to have both hrCode and hrDoc.

{%code_todo
    "src" : "src/MetadataManager.ts",
    "ref" : {
        "text" : "directive: ref.directive"
    }
%}



See if its necesary or even convenient to have this new type of structure

{%code_todo
    "src" : "src/MetadataManager.ts",
    "ref" : {
        "text" : "metadata.notFound.push"
    }
%}
