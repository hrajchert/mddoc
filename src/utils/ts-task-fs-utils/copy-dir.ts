import { Task } from "@ts-task/task";
import { pipe, Data } from "effect";
import * as Eff from "effect/Effect";

import { toEffect } from "../effect/ts-task.js";

import { copyFile } from "./copy-file.js";
import { walkDir } from "./walk-dir.js";

/**
 * Works like unix copy -R.
 * Copies the files from src_dir to dst_dir, creating the necesary folders in dst_dir to make that happen
 */
// TODO: change matchRe for the classical include exclude folders
function copyDirTask(src: string, dst: string, matchRe: string | RegExp) {
  // Precalculate the lenght of the name of the src dir
  const dirNameLength = src.length;

  return walkDir(src).chain(function (files) {
    const promises: ReturnType<typeof copyFile>[] = [];

    for (let i = 0; i < files.length; i++) {
      const m = files[i].match(matchRe);
      if (m) {
        const inputFilename = files[i];
        const outputFilename = dst + "/" + files[i].substr(dirNameLength + 1);
        // console.log(inputFilename.grey + " => ".green + outputFilename.grey);

        // Copy the file
        promises.push(copyFile(inputFilename, outputFilename));
      }
    }
    return Task.all(promises);
  });
}

export function copyDir(src: string, dst: string, matchRe: string | RegExp) {
  return pipe(
    toEffect(copyDirTask(src, dst, matchRe)),
    Eff.mapError((err) => new CopyDirError({ src, dst, err })),
  );
}

class CopyDirError extends Data.TaggedError("CopyDirError")<{ src: string; dst: string; err: NodeJS.ErrnoException }> {
  explain() {
    return `Could not copy dir from ${this.src} to ${this.dst}: ${this.err.message}`;
  }
}
