export function tap<T>(fn: (arg: T) => any) {
    return (arg: T) => {
        fn(arg);
        return arg;
    }
}