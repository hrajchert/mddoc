**Warning:**
This should be removed ASAP, as it breaks with encapsulation. It's here for now only until the MetadataManager is widely used and well defined.
{:.alert .alert-danger }

{%code_warning
    "src" : "src/MetadataManager.js",
    "ref" : {
        "text" : "MetadataManager.prototype.getPlainMetadata = function () {"
    }
%}


For some reason I don't like having this repetitive information, that I initialy got from the doc to the code, inversed
in the code to doc. The reason that I do it, is that I need it in the brackets plugin to be able to put labels to the different
directives. For now the solution is to have it duplicated, but I should go in favor of either adding a helper that can get
the directive in O(1), or think if I really really need to have both hrCode and hrDoc.

{%code_todo
    "src" : "src/MetadataManager.js",
    "ref" : {
        "text" : "\"directive\": ref.directive"
    }
%}
