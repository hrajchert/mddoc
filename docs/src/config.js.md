**Warning:**
I had to comment this as there are some cases that the output dir is no needed (when no documentation is generated).
I need to change this so that if the tool needs to generate output, then the configuration is checked for this, if its
not defined, error.
{:.alert .alert-danger }

{ % code_warning
    "src" : "src/config.ts",
    "ref" : {
        "text" : "this.outputDir === null"
    }
%}

Rename this, I don't like to use dir, instead use path and I thikn this should be templatePath, docPath, inputDocPath or something like that.
A looot of places to touch :(

{ % code_todo
    "src" : "src/config.ts",
    "priority" : 3,
    "ref" : {
        "text" : "this.inputDir = null;"
    }
% }
