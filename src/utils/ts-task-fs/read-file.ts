import { Task } from "@ts-task/task";
import * as fs from "fs";

export function readFile(path: string, options: any): Task<Buffer, NodeJS.ErrnoException> {
  return new Task((resolve, reject) => {
    fs.readFile(path, options, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
