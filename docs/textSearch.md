# Text Search in code

One of the first things I wanted to avoid was to have weak references between the md to the code, and line numbers are easy links but
are quite weak in the sense that if you change your code, the reference becomes outdated quite quickly.

So, I thought that I needed to bring something that is more stable and that understands code a little. This is the Search Text in code
(feature still to be named ;).

This feature means that you can find a literal text in the code and have some code controls on top of this. The search part is what you expect,
a literal `ctrl-f`, with the option of later on extending it to a regular expression search.

The code part, needs to understand the context of what is being written, and at the moment of this writting, only javascript parsing is supported through
the use of [esprima](http://esprima.org/).

A reference looks like this

    {%code_ref
        "src" : "somefile.js"
        "ref" : {
            "text" : "MarkdownReader.prototype.parse = function() {"
        }
    %}

Where the text field indicates that `MarkdownReader.prototype.parse = function() {` is going to be find directly in the code. The fact that
the extension is `.js` indicates that is going to be treated as a *Javascript* file.
Just by finding in text is enough for adding a small mark in a plugin like the [mdDocBracket]() plugin, but if we want to add change control,
or if we want to show the entire function in the markdown, we need to know some *Javascript* as well.

Enter esprima!.

In order to understand how the finder works, you need to understand a little about programming syntax, specially in this case, the *Javascript* syntax.
At least the basics, what is a *statement*, *expression*, *assignment*, *declaration*, etc. And also the fact that a program can be parsed into
an [Abstract Syntax Tree](http://en.wikipedia.org/wiki/Abstract_syntax_tree).

The default behaviour of the *Javascript TextFinder* is to find the most specific node in the AST that matches the queried text. Once we have that node
we can navigate the tree from there (not yet implemented).

So what does it means, the most specific node in the AST that matches the queried text?. Well, take in consideration the following code

    var foo = function () {
        var sum = 0;
        for (var i = 0; i < 5 ; i++) {
            sum++;
        }
        console.log(sum);
    }
    foo()

It its easy to see that the answer will be 5, and we can use the  [esprima parse demo](http://esprima.org/demo/parse.html#) to see
how is the AST for the code, something in this lines.

    Variable Declaration
        Function Expression
            Block Statement
                Variable Declaration
                For Statement
                    Block Statement
                        Expression Statement
                Expression Statement
        Expression Statement

If I want to select the *for statement*, I could use a semi complicated regexp that gets it, but its easier and more powerful to somehow indicate
the AST node that I want to reference. Take in account that if I select a node, I also select its childrens (I plan to add some types of filter)

[http://esprima.org/doc/index.html#ast](http://esprima.org/doc/index.html#ast)
That means that

TODO: Create a concept page about reference in which I talk about why is a very hard json and try to think a little in the terms of
the "templates" (choose a better name) and posible multi-inheritance type of nodes.

TODO: disable automatic AST tree generation
