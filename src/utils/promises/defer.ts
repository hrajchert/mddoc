/**
 * This helper was created to remove the dependency on when.js. Once we remove/refactor EventPromise,
 * we should remove this as well.
 */
export type DeferredPromise<T> = {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
}

export function defer<T>(): DeferredPromise<T> {
    let deferred = {} as DeferredPromise<T>;

    const promise = new Promise<T>((res, rej) => {
        deferred.resolve = res;
        deferred.reject = rej;
    });
    deferred.promise = promise;
    return deferred;
}