exports.CodeIncluder = require("./src/CodeIncluder").CodeIncluder;
exports.MarkdownReader = require("./src/MarkdownReader").MarkdownReader;
exports.CodeReader = require("./src/CodeReader").CodeReader;
exports.HtmlWriter = require("./src/HtmlWriter").HtmlWriter;

// TODO: remove this
// Eventually the tool is going to be in a separate project, and we are going to further divide metadata
// creation from html rendering
exports.tool = require("./src/tool");