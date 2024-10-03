export function tap<T>(fn: (arg: T) => unknown) {
  return (arg: T) => {
    fn(arg);
    return arg;
  };
}
