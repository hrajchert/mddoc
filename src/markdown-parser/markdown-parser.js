
module.exports = function (Markdown) {
    var miMkd = Markdown.subclassDialect(Markdown.dialects.Maruku);
    miMkd.processMetaHash = Markdown.dialects.Maruku.processMetaHash;

    // miMkd.block.supercode = function (block, next) {
    miMkd.block.supercode = function (block) {
        var m = block.match( /^{%([\w]+)([\s\S]*)%}$/ );

        if ( !m ) {
            return undefined;
        }
        var extraData = {
            lineNumber: block.lineNumber,
            type: m[1]
        };
        var jsonml = ["code_reference", m[2], extraData];
        return [jsonml];
    };

    Markdown.dialects.miMkd = miMkd;
    Markdown.buildBlockOrder ( Markdown.dialects.miMkd.block );
    Markdown.buildInlinePatterns( Markdown.dialects.miMkd.inline );
};
