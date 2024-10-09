import { Metadata } from "./metadata/metadata.js";
/*
Este archivo muestra claramente cual es el problema de la metadata como "variable global"
Para hacer el unit test tengo que precargar hrMd y jsonml, cuando en realidad yo requiero de
dos helpers o servicios
uno que recorra las referencias de los markdown y me de las referencias sin remplazar
otro que me de los bloques de codigo a remplazar
*/
export function includeCode(metadata: Metadata) {
  for (const mdFile in metadata.hrMd) {
    const refs = metadata.hrMd[mdFile].refs;
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i];
      if (ref.status === "found" && ref.directive === "code_inc") {
        // TODO: add an includer / formatter
        const snippet = metadata.hrCode[ref.src].refs[ref.refhash].snippet;
        ref.jsonml = ["code_block", snippet];
      } else if (
        ref.status === "found" &&
        (ref.directive === "code_ref" || ref.directive === "code_todo" || ref.directive === "code_warning")
      ) {
        ref.jsonml = ["div", { id: ref.refhash, class: "code_ref" }, ""];
      }
    }
  }
}
