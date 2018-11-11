import { Task } from '@ts-task/task';
import * as fs from 'fs';

export interface IWriteFileOptions {
    encoding?: string | null;
    mode?: number | string;
    flag?: string;
}

export function writeFile (path: string, data: unknown, options: IWriteFileOptions = {}) {
    return new Task<void, NodeJS.ErrnoException>((resolve, reject) => {
        fs.writeFile(path, data, options, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(void 0);
            }
        });
    });
}