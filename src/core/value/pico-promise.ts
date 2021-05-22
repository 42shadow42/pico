export type PromiseStatus = 'pending' | 'resolved' | 'rejected';

export type PicoPromise<TState> = Promise<TState> & { status: PromiseStatus };
