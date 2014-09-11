**Warning:**
I had to comment this as there are some cases that the output dir is no needed (when no documentation is generated).
I need to change this so that if the tool needs to generate output, then the configuration is checked for this, if its
not defined, error.
{:.alert .alert-danger }

{%code_warning
    "src" : "src/config.js",
    "ref" : {
        "text" : "this.outputDir === null"
    }
%}
