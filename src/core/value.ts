import isPromise from 'is-promise';

export type PromiseStatus = 'pending' | 'resolved' | 'rejected';

export type PicoValueSubscription<TState> = (value: TState) => void;

export class PicoValue<TState> {
	value: TState | undefined;
	promise: (Promise<TState> & { status: PromiseStatus }) | undefined;
	error: unknown;

	private subscribers = new Set<PicoValueSubscription<TState>>();
	private dependencies: Set<PicoValue<unknown>>;

	constructor(
		promiseOrValue: TState | Promise<TState>,
		dependencies = new Set<PicoValue<unknown>>()
	) {
		this.dependencies = dependencies;

		if (isPromise(promiseOrValue)) {
			this.updatePromise(promiseOrValue);
			return;
		}

		this.value = promiseOrValue;
	}

	private updatePromise = (promise: Promise<TState>) => {
		const status: PromiseStatus = 'pending';
		this.promise = Object.assign(promise, { status });

		promise.then((value: TState) => {
			// Ignore results that aren't currently pending.
			if (this.promise !== promise) {
				return;
			}
			this.promise.status = 'resolved';
			this.value = value;
		});

		promise.catch((error: unknown) => {
			// Ignore results that aren't currently pending.
			if (this.promise !== promise) return;
			this.promise.status = 'rejected';
			this.error = error;
			this.notify();
		});
	};

	getDependencies = (): Set<PicoValue<unknown>> => {
		return new Set<PicoValue<unknown>>(this.dependencies);
	};

	updateValue = (
		promiseOrValue: TState | Promise<TState>,
		dependencies = new Set<PicoValue<unknown>>()
	) => {
		this.dependencies = dependencies;

		if (isPromise(promiseOrValue)) {
			this.updatePromise(promiseOrValue);
			return;
		}

		this.value = promiseOrValue;
		this.notify();
	};

	subscribe = (callback: PicoValueSubscription<TState>) => {
		this.subscribers.add(callback);
	};

	unsubscribe = (callback: PicoValueSubscription<TState>) => {
		this.subscribers.delete(callback);
	};

	notify = () =>
		new Set(this.subscribers).forEach((callback) =>
			callback(this.value as TState)
		);
}
