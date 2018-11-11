import { Task } from '@ts-task/task';
import { share } from '@ts-task/utils';
import { mkdir } from '../ts-task-fs/mkdir';
import { stat } from '../ts-task-fs/stat';
import { writeFile } from '../ts-task-fs/write-file';
import { taskReduce } from '../ts-task-utils/task-reduce';

/**
 * Writes the contents of data in a file with filename. It creates
 * any directory it needs in order to create the file
 * @param path The path of the file to write
 * @param data The data to write
 */
export function writeFileCreateDir (path: string, data: unknown) {
    const trimmedPath = path.trim();
    // Don't allow absolute paths, for now

    // Extract the different directories as an array, and the filename separated
    const parts = trimmedPath.split('/');

    // If the parth is absolute, correct the parts
    if (trimmedPath[0] === '/') {
        parts.shift();
        parts[0] = '/' + parts[0];
    }

    parts.pop(); // filename

    // Create all the dirs needed to open the file
    const dirReady = taskReduce(
        parts,
        (path, part) => {
            const normalizedPath = path === '' ? part : `${path}/${part}`;

            // Create the current path if needed and return a promise of the next
            return _createDirIfNeeded(normalizedPath).map(_ => normalizedPath);
        },
        ''
    );

    // Once we have the directory ready, write the file
    return dirReady.chain(function () {
        return writeFile(trimmedPath, data);
    });
}

// Holds the directories checked to see if needed to be created
// This way we both save resource and avoid race conditions
// TODO: I don't like this
interface DirDictionary {
    [dirName: string]: ReturnType<typeof _doCreateDirIfNeeded>;
}
const _dirsChecked: DirDictionary = {};


function _createDirIfNeeded (path: string) {
    // If we have a request to check the path,  respond that directly
    if (!_dirsChecked.hasOwnProperty(path)) {
        // If not, check and store the promise
        _dirsChecked[path] = _doCreateDirIfNeeded(path).pipe(share());
    }
    return _dirsChecked[path];
}

function _doCreateDirIfNeeded (path: string) {
    return stat(path)
        .catch(err => {
            if (err.code === 'ENOENT') {
                return mkdir(path);
            } else {
                return Task.reject(err);
            }
        });
}