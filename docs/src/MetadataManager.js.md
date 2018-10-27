**Warning:**

For some reason I don't like having this repetitive information, that I initialy got from the doc to the code, inversed
in the code to doc. The reason that I do it, is that I need it in the brackets plugin to be able to put labels to the different
directives. For now the solution is to have it duplicated, but I should go in favor of either adding a helper that can get
the directive in O(1), or think if I really really need to have both hrCode and hrDoc.

{ % code_todo
    "src" : "src/MetadataManager.js",
    "ref" : {
        "text" : "\"directive\": ref.directive"
    }
%}

RESTORE

I should change the approach of this method and split it in two. First of all, im not creating the code metadata always, some times I create it,
some times I update it. What this method is actually doing is creating a task description for finding a reference, separating it into the
diferent files that are being referenced.

{ % code_todo
    "src" : "src/MetadataManager.js",
    "ref" : {
        "text" : "prototype.createHrCodeMetadata = function"
    }
%}

RESTORE


See if its necesary or even convenient to have this new type of structure

{ % code_todo
    "src" : "src/MetadataManager.js",
    "ref" : {
        "text" : "meta.notFound.push"
    }
%}

RESTORE
