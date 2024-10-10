import * as fs from "fs";

import { Task } from "@ts-task/task";

import { AnyWontFix } from "../typescript.js";

// This file should be removed when the code is migrated to effect
export function readFile(path: string, options: AnyWontFix): Task<Buffer, NodeJS.ErrnoException> {
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
