
module.exports = function (Markdown) {
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
};
