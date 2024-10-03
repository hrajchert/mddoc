import { Dictionary } from "./parmenides/dictionary.js";

export function objMap<A, B>(obj: Dictionary<A>, mapFn: (a: A, key: string) => B) {
  const ans: Dictionary<B> = {};
  for (const key in obj) {
    ans[key] = mapFn(obj[key], key);
  }
  return ans;
}
