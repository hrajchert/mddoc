## Directory Structure

The tool should ease the creation of whatever type of documentation you should choose. That
could mean that you may want to create

* Top down documentation (manual)
* Tutorial
* Source code walk-trough (Like backbone)
* Blog of development
* JSDocs
* Any combination

We don't want to enforce any type of layout or way of doing things. Thats why we use a template system to let you control
exactly how your documentation is presented.

The template system choosed for now is [ECT](http://ectjs.com/), because I like being close to html and how they made the inheritance system. Eventually this could be extended so you can use the template system you like.

The folder that holds the documention should not be enforced. There should be a couple of ect files that represents pages to be rendered, and should be referenced somehow (for now hardcoded). And the files that end in md are the markdown files that may contain source references.
