import { readFile } from "../ts-task-fs/readFile";
import { writeFileCreateDir } from "./writeFileCreateDir";

export function copyFile(src: string, dst: string) {
    return readFile(src, "utf8")
        .chain(file => writeFileCreateDir(dst, file));
}