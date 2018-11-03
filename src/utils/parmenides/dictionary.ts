import {Contract, obj, ParmenidesObjOfError, ParmenidesError} from 'parmenides';

export interface Dictionary<T> {
    [key: string]: T
}

export const dictionaryOf = <T>(contract: Contract<T>): Contract<Dictionary<T>> => {
    return (dictionary: Dictionary<T>) => {
        obj(dictionary);
        for (let key in dictionary) {
            try {
                contract(dictionary[key]);
            } catch (e) {
                if (!(e instanceof ParmenidesError)) {
                    throw e;
                }
                throw new ParmenidesObjOfError(e, key);
            }
        }
        return dictionary;
    }
}