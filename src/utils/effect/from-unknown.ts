import * as S from "@effect/schema/Schema";
import { Schema } from "@effect/schema/Schema";
import { Effect } from "effect";

// TODO: Remove this and use the schema inside an Effect context instead.
export function fromUnknownWithSchema<T>(schema: Schema<T>) {
  return (value: unknown): T => {
    return Effect.runSync(S.decodeUnknown(schema)(value));
  };
}
