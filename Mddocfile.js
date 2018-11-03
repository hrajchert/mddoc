module.exports = function() {
    const customGenerator = {
        copyAssets  : true,
        templateDir : "docs/custom-generator",
        outputDir   : "dist/custom-generator",
        files       : ["index", "blog", "mini_estructura", "comment_programming",
                         "concepts", "main", "main-jumbo", "concept-map"]
    };

    const fragmentGenerator = {
        outputDir   : "dist/custom-generator/fragment",
        priority    : 110
    };

    return {
        inputDir  : "docs",
        outputDir : "dist",
        verbose   : true,
        generators: {
            custom: customGenerator,
            "html-fragment": fragmentGenerator
        }
    }
};
