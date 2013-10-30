/*jshint -W065 */
var markdown = require("markdown").markdown;
var Markdown = markdown.Markdown;

var _ = require('underscore');
var fs = require("fs");

var inputFile = "docs/app.md";
var outputFile = "dist/app.html";


var miMkd = Markdown.subclassDialect(Markdown.dialects.Maruku);
miMkd.processMetaHash = Markdown.dialects.Maruku.processMetaHash;

miMkd.block.supercode = function (block, next) {
    var m = block.match( /^{%([\s\S]*)%}$/ );

    if ( !m ) {
      return undefined;
    }
    var jsonml = ['supercode', m[1]];
    return [jsonml];
};

Markdown.dialects.miMkd = miMkd;
Markdown.buildBlockOrder ( Markdown.dialects.miMkd.block );
Markdown.buildInlinePatterns( Markdown.dialects.miMkd.inline );

function replaceSupercode (jsonml) {
    if ( jsonml[0] === "supercode" ) {
        console.log ('we found supercode');

        var attr = JSON.parse("{"+jsonml[1]+"}");

        replaceCodeFromFile(jsonml, attr['src'], attr["line"] );

    } else {
        console.log ('not this one');
        for (var i=1; i< jsonml.length ; i++) {
            if (Array.isArray(jsonml[i])) {
                replaceSupercode(jsonml[i]);
            }
        }
    }
}

function replaceCodeFromFile(jsonml, file, lineNumber) {
    fs.readFile(file, 'utf8', function(err, data) {
        if (err)
            throw err;

        var lines = data.split("\n");
        var numbers = lineNumber.split("-");
        if ( numbers.length != 2 ) {
            throw 'The line number wasnt correctly spelled';
        }

        var firstLine = parseInt(numbers[0]);
        var lastLine = parseInt(numbers[1]);

        if (typeof firstLine !== 'number' || typeof lastLine !== 'number') {
            throw 'Those arent numbers cowboy';
        }

        if (firstLine > lastLine) {
            throw 'lastLine cannot be bigger than firstLine';
        }
        var ans = lines[firstLine - 1];
        for (var i=firstLine + 1; i <= lastLine;i++) {
            ans += "\n" + lines[ i - 1 ];
        }

        jsonml[0] = 'code_block';
        jsonml[1] = ans;
    });
}

fs.readFile(inputFile, 'utf8', function(err, md) {
    fs.readFile('template.html', 'utf8', function(err, template) {

        var jsonml = markdown.parse(md, 'miMkd');

        // debugger;
        replaceSupercode(jsonml);
        setTimeout(function() {
            var tree = markdown.toHTMLTree(jsonml);
            var html = markdown.renderJsonML(tree);
            var output = _.template(template,{html: html});
            fs.writeFile(outputFile, output, function(err){
                console.log('its done');
            });
        },2000);

    });
});
