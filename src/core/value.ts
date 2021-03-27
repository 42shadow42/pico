import isPromise from 'is-promise';

export type PromiseStatus = 'pending' | 'resolved' | 'rejected';

export type ValueCreatedHandler<TState> = (
	value: PicoValue<TState>,
	internalKey: string
) => void;
export type ValueUpdatingHandler<TState> = (
	value: PicoValue<TState>,
	internalKey: string
) => void;
export type ValueUpdatedHandler<TState> = (
	value: PicoValue<TState>,
	internalKey: string
) => void;
export type ValueDeletingHandler<TState> = (
	value: PicoValue<TState>,
	internalKey: string
) => void;

export interface PicoValueSubscriber<TState> {
	onUpdating?: ValueUpdatingHandler<TState>;
	onUpdated?: ValueUpdatedHandler<TState>;
}

export interface PicoValueEffect<TState> {
	onCreated?: ValueCreatedHandler<TState>;
	onUpdating?: ValueUpdatingHandler<TState>;
	onUpdated?: ValueUpdatedHandler<TState>;
	onDeleting?: ValueDeletingHandler<TState>;
}

export class PicoValue<TState> {
	value: TState | undefined;
	promise: (Promise<TState> & { status: PromiseStatus }) | undefined;
	error: unknown;

	private key: string;
	private effects: PicoValueEffect<TState>[];
	private subscribers = new Set<PicoValueSubscriber<TState>>();
	private dependencies: Set<PicoValue<unknown>>;

	constructor(
		key: string,
		promiseOrValue: TState | Promise<TState>,
		effects: PicoValueEffect<TState>[],
		dependencies = new Set<PicoValue<unknown>>()
	) {
		this.key = key;
		this.effects = effects;
		this.dependencies = dependencies;

		if (isPromise(promiseOrValue)) {
			this.updatePromise(promiseOrValue);
			return;
		}

		this.value = promiseOrValue;

		this.effects.forEach(
			(effect) => effect.onCreated && effect.onCreated(this, this.key)
		);
	}

	internalDelete = () => {
		this.effects.forEach(
			(effect) => effect.onDeleting && effect.onDeleting(this, this.key)
		);
	};

	private updatePromise = (promise: Promise<TState>) => {
		const status: PromiseStatus = 'pending';
		this.promise = Object.assign(promise, { status });

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

	getEffects = () => [...this.effects];

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

	subscribe = (subscriber: PicoValueSubscriber<TState>) => {
		this.subscribers.add(subscriber);
	};

	unsubscribe = (subscriber: PicoValueSubscriber<TState>) => {
		this.subscribers.delete(subscriber);
	};

	private onValueUpdating = () => {
		this.effects.forEach(
			(effect) => effect.onUpdating && effect.onUpdating(this, this.key)
		);
		new Set(this.subscribers).forEach(
			(subscriber) =>
				subscriber.onUpdating && subscriber.onUpdating(this, this.key)
		);
	};

	private onValueUpdated = () => {
		this.effects.forEach(
			(effect) => effect.onUpdated && effect.onUpdated(this, this.key)
		);
		new Set(this.subscribers).forEach(
			(subscriber) =>
				subscriber.onUpdated && subscriber.onUpdated(this, this.key)
		);
	};
}
