import * as S from "@effect/schema/Schema";
import { Schema } from "@effect/schema/Schema";

import { IFileReaderQuerySchema } from "../code-reader/code-finder-query-js-text.js";
import { ICodeFinderLineQuerySchema } from "../code-reader/code-finder-query-line.js";

function JSonMLNode<K extends string, T>(nodeName: K, schema: S.Schema<T>): S.Schema<readonly [K, ...T[]]> {
  return S.Tuple([S.Literal(nodeName)], schema).annotations({ identifier: `Node ${nodeName}` });
}

//#region standard JSonML
const JInlineCode = JSonMLNode("inlinecode", S.String);
const JLink = S.Tuple(S.Literal("link"), S.Struct({ href: S.String }), S.String).annotations({ identifier: "Node Link" });
const JStrong = JSonMLNode("strong", S.Any);
const JEmph = JSonMLNode("em", S.Any);
const JClass = S.Struct({ class: S.String });
const JParagraphElement = S.Union(S.String, JInlineCode, JLink, JStrong, JClass, JEmph);

const JCodeBlock = JSonMLNode("code_block", S.Any);
const JBlockquote = JSonMLNode("blockquote", S.Any);
const JHeader = S.Tuple(S.Literal("header"), S.Struct({ level: S.Number }), S.String).annotations({ identifier: "Node Header" });

const JBulletList = JSonMLNode("bulletlist", S.Any);
const JNumberList = JSonMLNode("numberlist", S.Any);
const JParagraph = JSonMLNode("para", JParagraphElement);

//#endregion

//#region custon JSonML
const JCodeReference = S.Tuple(
  S.Literal("code_reference"),
  S.String,
  S.Struct({ lineNumber: S.Number, type: S.String }),
).annotations({ identifier: "Node Code Reference" });
const JDiv = S.Tuple(S.Literal("div"), S.Struct({ class: S.String, id: S.String }), S.String).annotations({
  identifier: "Node Div",
});

export const CodeReferenceAttr = S.Struct({
  src: S.String,
  name: S.optional(S.String),
  priority: S.optional(S.Number),
  ref: S.Union(ICodeFinderLineQuerySchema, IFileReaderQuerySchema),
  referingBlocks: S.optional(S.Number),
});

//#endregion
const JElement = S.Union(
  JHeader,
  JParagraph,
  JBulletList,
  JCodeBlock,
  JCodeReference,
  JNumberList,
  JBlockquote,
  JDiv,
).annotations({
  identifier: "JSON Element",
});

export type JSonMLNode = S.Schema.Type<typeof JElement>;

export const JSonMLSchema = JSonMLNode("markdown", JElement);
export interface JSonML extends Schema.Type<typeof JSonMLSchema> {}

export const isCodeReference = S.is(JCodeReference);
