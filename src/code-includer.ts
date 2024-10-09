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
        // @ts-expect-error Right now the type says readonly but I need to make the mutation this way in order for the generation to work.
        ref.jsonml[0] = "code_block";
        // @ts-expect-error same as above
        ref.jsonml[1] = snippet;
        // ref.jsonml = ["code_block", snippet];
      } else if (
        ref.status === "found" &&
        (ref.directive === "code_ref" || ref.directive === "code_todo" || ref.directive === "code_warning")
      ) {
        // @ts-expect-error Right now the type says readonly but I need to make the mutation this way in order for the generation to work.
        ref.jsonml[0] = "div";
        // @ts-expect-error same as above
        ref.jsonml[1] = { id: ref.refhash, class: "code_ref" };
        // @ts-expect-error same as above
        ref.jsonml[2] = `Code reference to ${ref.src} with hash ${ref.refhash}`;
        // TODO: This is only adding an empty div, We should have a way to define the project repository, check the commit and
        //       get a github permalink for example.
        // ref.jsonml = ["div", { id: ref.refhash, class: "code_ref" }, ""];
      }
    }
  }
}
