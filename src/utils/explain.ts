import { UnknownError } from "@ts-task/task";

const PrettyError = require("pretty-error");
const pe = new PrettyError();

interface Explainable {
    explain: () => string;
}

function isExplainable (error: any): error is Explainable {
    return 'explain' in error;
}

export function explain<T extends Explainable> (error: T | UnknownError) {
    if (isExplainable(error)) {
        return error.explain();
    } else {
        return 'Unknown Error\n' + pe.render(error);
    }
}

export function renderError(error: Error) {
    return pe.render(error);
}