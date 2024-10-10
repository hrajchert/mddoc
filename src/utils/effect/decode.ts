import { ParseOptions } from "@effect/schema/AST";
import { ParseError } from "@effect/schema/ParseResult";
import * as S from "@effect/schema/Schema";
import { Effect, pipe } from "effect";

type DecodeUnknownOrError<A, E> = {
  schema: S.Schema<A>;
  options?: ParseOptions;
  onError: (parseResult: ParseError) => E;
};
export const decodeUnknownOrError = <A, E>(options: DecodeUnknownOrError<A, E>) => {
  return (unk: unknown) =>
    pipe(
      unk,
      S.decodeUnknown(options.schema, options.options),
      Effect.catchTag("ParseError", (err) => Effect.fail(options.onError(err))),
    );
};
