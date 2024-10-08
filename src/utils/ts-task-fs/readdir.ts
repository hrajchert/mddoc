import * as fs from "fs";

import { Task } from "@ts-task/task";

export function readdir(path: string) {
  return new Task<string[], NodeJS.ErrnoException>((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}
