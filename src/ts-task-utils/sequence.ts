import { Task } from '@ts-task/task';

export type Step<E> =  () => Task<any, E>;

export function sequence<E1> (steps: Step<E1>[]): Task<void, E1> {
    // clone the steps
    let newSteps = [...steps] as [Step<any>];
    // Remove the next step from the array
    const nextStep = newSteps.shift();
    // If there are any left, resolve inmediatly
    if (!nextStep) {
        return Task.resolve(void 0);
    } else {
        // If there is a step invoke it
        return nextStep().chain(
            () => sequence(newSteps)
        );
    }
}