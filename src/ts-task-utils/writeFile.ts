import * as fs from 'fs';
import { Task } from '@ts-task/task';

export interface IWriteFileOptions {
    encoding?: string | null;
    mode?: number | string;
    flag?: string;
}

export function writeFile(path: string, data: any, options: IWriteFileOptions = {}) {
    return new Task<void, NodeJS.ErrnoException>((resolve, reject) => {
        fs.writeFile(path, data, options, (err) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(void 0);
            }
        })
    });
}