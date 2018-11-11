import { readFile } from '../ts-task-fs/read-file';
import { writeFileCreateDir } from './write-file-create-dir';

export function copyFile (src: string, dst: string) {
    return readFile(src, 'utf8')
        .chain(file => writeFileCreateDir(dst, file));
}