{%
    "src": "blabla.js",
    "line": "14-99",
    "soco":["a","b"]
%}

# Hello

world 3


> this is a quote

> > This is a nested quote


## The following is a

* list
* of
* elements
{: .pepe}

## This is code
    var markdown = require("markdown").markdown;
    var _ = require('underscore');
    var fs = require("fs");

    fs.readFile('docs/test1.md', 'utf8', function(err, md) {
        fs.readFile('template.html', 'utf8', function(err, template) {
            var html = markdown.toHTML( md, 'Maruku');
            var output = _.template(template,{html: html});
            fs.writeFile('dist/test1.html', output, function(err){
                console.log('its done');
            });
        });
    });
{: #bar}


