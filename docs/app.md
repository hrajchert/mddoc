# This is a simple hardcoded example

The idea of this project is to be a documentation tool that holds one way references from the documentation to the code, and hopefully has a way of indicating when the documentation is obsolete.

One of the main ideas to keep is that it should be self used. That is, the documentation of this tool should be built with the tool itself, and most of the features this tool will have, should came from this self using process.

As a first proof of concept, in the first commit I include this markdown document that reference to the "tool". The syntax so far is super ugly and will change. But for now, you can include a code reference by placing this code in markdown

    {%
        "src" : "app.js",
        "line" : "12-27"
    %}


That code references lines 12 to 27 of the app.js. That part of the code is in charge of telling markdown-js that anything that goes inside {% %} should be marked as a code reference.

{%
    "src" : "app.js",
    "line" : "12-27"
%}

