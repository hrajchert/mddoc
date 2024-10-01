import { Task } from '@ts-task/task';
import { Contract, ParmenidesError } from 'parmenides';
import { fromUnknown } from './from-unknown.js';
import { FixAnyTypeScriptVersion } from '../typescript.js';


export function validateContract<T> (contract: Contract<T>) {
    return function (obj: unknown) {
        return new Task<T, ParmenidesError>((resolve, reject) => {
            try {
                resolve(fromUnknown(contract)(obj));
            } catch (err: FixAnyTypeScriptVersion) {
                reject(err);
            }
        });
    };
}