import { Task } from '@ts-task/task';
import * as fs from 'fs';

export function readFile(path: string, options: any) {
    return new Task<Buffer, NodeJS.ErrnoException>((resolve, reject) => {
        fs.readFile(path, options, (err, data) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
}

