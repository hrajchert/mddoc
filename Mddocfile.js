module.exports = function(mddoc) {
    mddoc.initConfig({
        "inputDir" : "docs",
        "outputDir": "dist",
    });

    mddoc.addGenerator("custom", {
        "copyAssets"  : true,
        "templateDir" : "docs/custom-generator",
        "outputDir"   : "dist/custom-generator",
        "files"       : ["index", "blog", "mini_estructura", "comment_programming",
                         "concepts", "main", "main-jumbo", "concept-map"]
    });

    mddoc.addGenerator("html-fragment", {
        "outputDir"   : "dist/custom-generator/fragment",
        "priority"    : 110
    });
};
