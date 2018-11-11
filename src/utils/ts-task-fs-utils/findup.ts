import { Task } from '@ts-task/task';
const nodefindup = require('findup');

export function findup (path: string, file: string) {
    return new Task<string, NodeJS.ErrnoException>((resolve, reject) => {
        nodefindup(path, file, (err: NodeJS.ErrnoException, dir: string) => {
            if (err) {
                reject(err);
            } else {
                resolve(dir);
            }
        });
    });
}