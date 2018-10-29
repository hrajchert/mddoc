import * as fs from 'fs';
import { Task } from '@ts-task/task';

export function stat (path: string) {
    return new Task<fs.Stats, NodeJS.ErrnoException>((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(stats);
            }
        })
    });

}