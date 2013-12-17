
var CodeIncluder = function(metadata) {
    this.metadata = metadata;
};
/*
Este archivo muestra claramente cual es el problema de la metadata como "variable global"
Para hacer el unit test tengo que precargar hrMd y jsonml, cuando en realidad yo requiero de
dos helpers o servicios
uno que recorra las referencias de los markdown y me de las referencias sin remplazar
otro que me de los bloques de codigo a remplazar
*/
CodeIncluder.prototype.include = function () {
    var mdFile, refs, ref, snippet ;
    for (mdFile in this.metadata.hrMd) {
        refs = this.metadata.hrMd[mdFile].refs;
        for (var i = 0; i < refs.length ; i++) {
            ref = refs[i];
            if (ref.found && ref.directive === "code_inc") {
                // TODO: add an includer / formatter
                snippet = this.metadata.hrCode[ref.src].refs[ref.refhash].snippet;
                ref.jsonml[0] = "code_block";
                ref.jsonml[1] = snippet;
            } else if (ref.found && (ref.directive === "code_ref" || ref.directive === "code_todo" ||
                                     ref.directive === "code_warning")) {
                ref.jsonml[0] = "div";
                ref.jsonml[1] = {"id": ref.refhash, "class":"code_ref"};
                ref.jsonml[2] = "";

            }
        }

    }
    return this;
};

exports.CodeIncluder = CodeIncluder;
