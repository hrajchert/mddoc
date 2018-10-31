import { Task } from '@ts-task/task';
import * as fs from 'fs';

type ReadFileOptions = { encoding?: null; flag?: string; } | undefined | null;
type ReadFileOptions2 = { encoding: string; flag?: string; } | string;

export function readFile(path: string, options: ReadFileOptions): Task<Buffer, NodeJS.ErrnoException>;
export function readFile(path: string, options: ReadFileOptions2): Task<Buffer, NodeJS.ErrnoException>;
export function readFile(path: string, options: any): Task<Buffer, NodeJS.ErrnoException> {
    return new Task((resolve, reject) => {
        fs.readFile(path, options, (err, data) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
}

