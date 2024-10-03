import { Contract } from "parmenides";

export function fromUnknown<T>(contract: Contract<T>) {
  return (value: unknown): T => {
    return contract(value as any);
  };
}
