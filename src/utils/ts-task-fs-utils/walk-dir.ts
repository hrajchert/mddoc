import * as fs from "fs";

import { Task, UnknownError } from "@ts-task/task";
import * as A from "effect/Array";

import { readdir } from "../ts-task-fs/readdir.js";
import { stat } from "../ts-task-fs/stat.js";

interface WalkDirOptions {
  exclude?: string | readonly string[];
}

/**
 * Method that walks a directory and returns a promise of all the files in it. Recursivly
 * @param dir       The directory to walk
 * @param options    For now an object that has exclude
 * @return A task of an array that holds all the files
 */
export function walkDir(dir: string, options?: WalkDirOptions) {
  return doWalkDir(dir, options);
}

/**
 * This is the recursive method that actually does the walking. It is
 * needed to have both methods as this recursiveness doesn't provide a flattened
 * array
 */
function doWalkDir(dir: string, options?: WalkDirOptions): Task<string[], NodeJS.ErrnoException | UnknownError> {
  // Get all the files (including subdirectories)
  return readdir(dir).chain((files) => {
    // An array of tasks of the file stat (to see if we need to recurse or not)
    const filePromises: Array<Task<string[], NodeJS.ErrnoException | UnknownError>> = [];

    // For each file, check if directory. If it is, recurse, if not
    // boom.
    for (let i = 0; i < files.length; i++) {
      const filename = dir + "/" + files[i];
      // Do not include excluded files
      if (isFileExcluded(filename, options)) {
        continue;
      }
      // Check if it is a directory or not
      filePromises.push(stat(filename).chain(checkIsDirectory(filename, options)));
    }
    return Task.all(filePromises).map((x) => A.flatten(x));
  });
}

function checkIsDirectory(filename: string, options?: WalkDirOptions) {
  return function (stat: fs.Stats) {
    // If its not a directory, resolve it on the spot with the name of the file
    if (!stat.isDirectory()) {
      return Task.resolve([filename]);
    }
    // If it is, resolve it once its subdirectory is resolved
    else {
      return doWalkDir(filename, options);
    }
  };
}

function isFileExcluded(file: string, options?: WalkDirOptions) {
  let isExcluded = false;
  if (typeof options === "undefined") return false;
  if (typeof options.exclude !== "undefined") {
    const exclude = typeof options.exclude === "string" ? [options.exclude] : options.exclude;

    exclude.forEach((exc) => {
      if (file.match(exc)) {
        isExcluded = true;
      }
    });
  }

  return isExcluded;
}
