import isPromise from 'is-promise';

export type PromiseStatus = 'pending' | 'resolved' | 'rejected';

export type ValueUpdatingHandler = (key: string) => void;
export type ValueUpdatedHandler = (key: string) => void;

export interface PicoValueSubscriber {
	onUpdating?: ValueUpdatingHandler;
	onUpdated?: ValueUpdatedHandler;
}

export class PicoValue<TState> {
	private key: string;
	value: TState | undefined;
	promise: (Promise<TState> & { status: PromiseStatus }) | undefined;
	error: unknown;

	private subscribers = new Set<PicoValueSubscriber>();
	private dependencies: Set<PicoValue<unknown>>;

	constructor(
		key: string,
		promiseOrValue: TState | Promise<TState>,
		dependencies = new Set<PicoValue<unknown>>()
	) {
		this.key = key;
		this.dependencies = dependencies;

		if (isPromise(promiseOrValue)) {
			this.updatePromise(promiseOrValue);
			return;
		}

		this.value = promiseOrValue;
	}

	private updatePromise = (promise: Promise<TState>) => {
		this.onValueUpdating();
		const status: PromiseStatus = 'pending';
		this.promise = Object.assign(promise, { status });
		this.onValueUpdated();

		promise.then((value: TState) => {
			// Ignore results that aren't currently pending.
			if (this.promise !== promise) {
				return;
			}
			this.onValueUpdating();
			this.promise.status = 'resolved';
			this.value = value;
			this.onValueUpdated();
		});

		promise.catch((error: unknown) => {
			// Ignore results that aren't currently pending.
			if (this.promise !== promise) return;
			this.onValueUpdating();
			this.promise.status = 'rejected';
			this.error = error;
			this.onValueUpdated();
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
		this.onValueUpdating();
		this.value = promiseOrValue;
		this.onValueUpdated();
	};

	subscribe = (subscriber: PicoValueSubscriber) => {
		this.subscribers.add(subscriber);
	};

	unsubscribe = (subscriber: PicoValueSubscriber) => {
		this.subscribers.delete(subscriber);
	};

	private onValueUpdating = () => {
		new Set(this.subscribers).forEach(
			(subscriber) =>
				subscriber.onUpdating && subscriber.onUpdating(this.key)
		);
	};

	private onValueUpdated = () => {
		new Set(this.subscribers).forEach(
			(subscriber) =>
				subscriber.onUpdated && subscriber.onUpdated(this.key)
		);
	};
}
