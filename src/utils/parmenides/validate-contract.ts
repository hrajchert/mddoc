import { Contract, ParmenidesError } from "parmenides";
import { Task } from "@ts-task/task";

export function validateContract<T> (contract: Contract<T>) {
    return function (obj: any) {
        return new Task<T, ParmenidesError>((resolve, reject) => {
            try {
                resolve(contract(obj));
            } catch (err) {
                reject(err);
            }
        });
    }
}