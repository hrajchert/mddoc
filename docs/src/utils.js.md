This method is quite slow, if you have many subfiles it will hang, need to refactor. Also add in some way glob notation.

{%code_todo
    "src" : "src/utils/ts-task-fs-utils/walkDir.ts",
    "priority" : 7,
    "ref" : {
        "text" : "export function walkDir"
    }
%}
