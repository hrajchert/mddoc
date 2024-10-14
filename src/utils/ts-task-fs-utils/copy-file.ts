import { readFile } from "../ts-task-fs/read-file.js";

import { writeFileCreateDirTask } from "./write-file-create-dir.js";

export function copyFile(src: string, dst: string) {
  return readFile(src, "utf8").chain((file) => writeFileCreateDirTask(dst, file));
}
