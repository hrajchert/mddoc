
**Warning:**
Before actual releasing of this project, I should be really careful on the interface that I expose. In
particular with exposing utils, which could be very changing. Probably I should create a separate project for
that.
{:.alert .alert-danger }

{%code_warning
    "src" : "src/PluginResolver.js",
    "priority" : 7,
    "ref" : {
        "text" : "exports.utils = require(\"./utils\");"
    }
%}
