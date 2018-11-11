import { Task, UnknownError } from '@ts-task/task';

type TaskReducer <T, A, E> = (accu: A, curr: T) => Task<A, E>;

export function taskReduce<T, A, E> (items: T[], taskReducer: TaskReducer<T, A, E>, initial: A) {
    const loop = (index: number) => (curr: A): Task<A, E | UnknownError> => {
        if (index >= items.length) {
            return Task.resolve(curr);
        } else {
            return taskReducer(curr, items[index])
                .chain(loop(index + 1));
        }
    };

    return Task.resolve(initial)
        .chain(loop(0));
}
