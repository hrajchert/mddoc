import { Task } from "@ts-task/task";
import * as fs from "fs";

export function stat(path: string) {
  return new Task<fs.Stats, NodeJS.ErrnoException>((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}
