import { Contract } from 'parmenides';

export type ContractOf<T> = T extends Contract<infer C> ? C : never;
