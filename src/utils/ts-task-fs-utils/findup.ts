import { Task } from '@ts-task/task';
// @ts-expect-error findup is not typed
import nodefindup from 'findup';

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