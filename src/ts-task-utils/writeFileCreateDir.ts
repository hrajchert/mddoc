import * as fs from 'fs';
import { Task } from '@ts-task/task';
import { taskReduce } from './task-reduce';
import { writeFile } from './writeFile';
import { stat } from './stat';
import { mkdir } from './mkdir';

/**
 * Writes the contents of data in a file with filename. It creates
 * any directory it needs in order to create the file
 * @param path The path of the file to write
 * @param data The data to write
 */
export function writeFileCreateDir(path: string, data: any) {
    path = path.trim();
    // Don't allow absolute paths, for now

    // Extract the different directories as an array, and the filename separated
    let parts = path.split("/");

    // If the parth is absolute, correct the parts
    if (path[0] === "/") {
        parts.shift();
        parts[0] = "/" + parts[0];
    }

    parts.pop(); //filename

    // Create all the dirs needed to open the file
    const dirReady = taskReduce(parts, function(path, part) {
        if (path === "") {
            path = part;
        } else {
            path = path + "/" + part;
        }

        // Create the current path if needed and return a promise of the next
        return _createDirIfNeeded(path).map(_ => path);
    }, "");

    // Once we have the directory ready, write the file
    return dirReady.chain(function() {
        return writeFile(path, data);
    });
}

// Holds the directories checked to see if needed to be created
// This way we both save resource and avoid race conditions
// TODO: I don't like this
interface DirDictionary {
    [dirName: string]: Task<any, any>
}
var _dirsChecked: DirDictionary = {};


function _createDirIfNeeded(path: string) {
    // If we have a request to check the path,  respond that directly
    if (!_dirsChecked.hasOwnProperty(path)) {
        // If not, check and store the promise
        _dirsChecked[path] = _doCreateDirIfNeeded(path);
    }
    return _dirsChecked[path];
}

function _doCreateDirIfNeeded(path: string) {
    return stat(path)
        .catch(err => {
            if (err.code === 'ENOENT') {
                return mkdir(path);
            } else {
                return Task.reject(err);
            }
        })
}