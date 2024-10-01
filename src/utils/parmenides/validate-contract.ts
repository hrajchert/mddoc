import { Task } from '@ts-task/task';
import { Contract, ParmenidesError } from 'parmenides';
import { fromUnknown } from './from-unknown';
import { FixAnyTypeScriptVersion } from '../typescript';


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