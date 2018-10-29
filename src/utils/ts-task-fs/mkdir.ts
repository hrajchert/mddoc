import * as fs from 'fs';
import { Task } from '@ts-task/task';

export function mkdir (path: fs.PathLike, mode: number | string | undefined | null = undefined) {
    return new Task<void, NodeJS.ErrnoException>((resolve, reject) => {
        fs.mkdir(path, mode, (err) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(void 0);
            }

        })
    })
}