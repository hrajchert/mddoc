import { Task } from "@ts-task/task";
import { share } from "@ts-task/utils";
import { pipe, Data } from "effect";
import * as Eff from "effect/Effect";

import { toEffect } from "../effect/ts-task.js";
import { mkdir } from "../ts-task-fs/mkdir.js";
import { stat } from "../ts-task-fs/stat.js";
import { writeFile } from "../ts-task-fs/write-file.js";
import { taskReduce } from "../ts-task-utils/task-reduce.js";

// TODO: Re-write using Effect.
/**
 * Writes the contents of data in a file with filename. It creates
 * any directory it needs in order to create the file
 * @param path The path of the file to write
 * @param data The data to write
 * @deprecated
 */
export function writeFileCreateDirTask(path: string, data: string | Buffer) {
  const trimmedPath = path.trim();
  // Don't allow absolute paths, for now

  // Extract the different directories as an array, and the filename separated
  const parts = trimmedPath.split("/");

  // If the parth is absolute, correct the parts
  if (trimmedPath[0] === "/") {
    parts.shift();
    parts[0] = "/" + parts[0];
  }

  parts.pop(); // filename

  // Create all the dirs needed to open the file
  const dirReady = taskReduce(
    parts,
    (path, part) => {
      const normalizedPath = path === "" ? part : `${path}/${part}`;

      // Create the current path if needed and return a promise of the next
      return _createDirIfNeeded(normalizedPath).map((_) => normalizedPath);
    },
    "",
  );

  // Once we have the directory ready, write the file
  return dirReady.chain(function () {
    return writeFile(trimmedPath, data);
  });
}

/**
 * Writes the contents of data in a file with filename. It creates
 * any directory it needs in order to create the file
 * @param path The path of the file to write
 * @param data The data to write
 */
export function writeFileCreateDir(path: string, data: string | Buffer) {
  return pipe(
    toEffect(writeFileCreateDirTask(path, data)),
    Eff.mapError((err) => new WriteFileError({ fsError: err, path })),
  );
}

class WriteFileError extends Data.TaggedError("WriteFileError")<{ fsError: NodeJS.ErrnoException; path: string }> {
  explain() {
    return `Could not write to file ${this.path}: ${this.fsError.message}`;
  }
}

// Holds the directories checked to see if needed to be created
// This way we both save resource and avoid race conditions
// TODO: I don't like this
interface DirDictionary {
  [dirName: string]: ReturnType<typeof _doCreateDirIfNeeded>;
}
const _dirsChecked: DirDictionary = {};

function _createDirIfNeeded(path: string) {
  // If we have a request to check the path,  respond that directly
  if (!Object.prototype.hasOwnProperty.call(_dirsChecked, path)) {
    // If not, check and store the promise
    _dirsChecked[path] = _doCreateDirIfNeeded(path).pipe(share());
  }
  return _dirsChecked[path];
}

function _doCreateDirIfNeeded(path: string) {
  return stat(path).catch((err) => {
    if (err.code === "ENOENT") {
      return mkdir(path);
    } else {
      return Task.reject(err);
    }
  });
}
