import { Contract, ParmenidesError } from "parmenides";
import { Task } from "@ts-task/task";
import { fromUnknown } from "./from-unknown";


export function validateContract<T> (contract: Contract<T>) {
    return function (obj: unknown) {
        return new Task<T, ParmenidesError>((resolve, reject) => {
            try {
                resolve(fromUnknown(contract)(obj));
            } catch (err) {
                reject(err);
            }
        });
    }
}