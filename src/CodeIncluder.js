
var CodeIncluder = function(metadata) {
    this.metadata = metadata;
};

CodeIncluder.prototype.include = function () {
    // Replace the code, clearly not going to be here.
    var mdFile, refs, ref, snippet ;
    for (mdFile in this.metadata.hrMd) {
        refs = this.metadata.hrMd[mdFile].refs;
        for (var i = 0; i < refs.length ; i++) {
            ref = refs[i];
            if (ref.found && ref.type === "include") {
                // TODO: add an includer / formatter
                snippet = this.metadata.hrCode[ref.src].refs[ref.refhash].snippet;
                ref.jsonml[0] = "code_block";
                ref.jsonml[1] = snippet;
            } else if (ref.found && ref.type === "reference") {
                ref.jsonml[0] = "div";
                ref.jsonml[1] = {"id": ref.refhash, "class":"code_ref"};
                ref.jsonml[2] = "";

            }
        }

    }
    return this;
};

exports.CodeIncluder = CodeIncluder;