import isPromise from 'is-promise';
import { InternalReadOnlyPicoHandler } from './handler';
import { PicoWriterProps } from './shared';
import { PicoStore } from './store';

export type PromiseStatus = 'pending' | 'resolved' | 'rejected';
export type PicoValueType = 'atom' | 'selector';
export type ValueEvent<TState> = PicoWriterProps & {
	key: string;
	value: PicoValue<TState>;
};

export type PicoEffectHandler<TState> = (props: ValueEvent<TState>) => void;
export type ValueUpdatingHandler<TState> = (
	picoValue: PicoValue<TState>
) => void;
export type ValueUpdatedHandler<TState> = (
	picoValue: PicoValue<TState>
) => void;

export interface PicoValueSubscriber<TState> {
	onUpdating?: ValueUpdatingHandler<TState>;
	onUpdated?: ValueUpdatedHandler<TState>;
}

export interface PicoEffect<TState> {
	onCreated?: PicoEffectHandler<TState>;
	onUpdating?: PicoEffectHandler<TState>;
	onUpdated?: PicoEffectHandler<TState>;
	onDeleting?: PicoEffectHandler<TState>;
}

export class PicoValue<TState> {
	key: string;
	type: PicoValueType;
	value: TState | undefined;
	promise: (Promise<TState> & { status: PromiseStatus }) | undefined;
	error: unknown;

	private store: PicoStore;
	private effects: PicoEffect<TState>[];
	private subscribers = new Set<PicoValueSubscriber<TState>>();
	private dependencies: Set<PicoValue<unknown>>;

	constructor(
		key: string,
		type: PicoValueType,
		store: PicoStore,
		promiseOrValue: TState | Promise<TState>,
		effects: PicoEffect<TState>[],
		dependencies = new Set<PicoValue<unknown>>()
	) {
		this.key = key;
		this.type = type;
		this.store = store;
		this.effects = effects;
		this.dependencies = dependencies;

		if (isPromise(promiseOrValue)) {
			this.updatePromise(promiseOrValue);
			return;
		}

		this.value = promiseOrValue;

		this.effects.forEach(
			(effect) =>
				effect.onCreated &&
				effect.onCreated(
					Object.assign(this.getPicoWriterProps(), {
						value: this,
						key: this.key
					})
				)
		);
	}

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

	// public because deletions are triggered by the store
	onDeleting = () => {
		this.effects.forEach(
			(effect) =>
				effect.onDeleting &&
				effect.onDeleting(
					Object.assign(this.getPicoWriterProps(), {
						value: this,
						key: this.key
					})
				)
		);
	};

	private onValueUpdating = () => {
		this.effects.forEach(
			(effect) =>
				effect.onUpdating &&
				effect.onUpdating(
					Object.assign(this.getPicoWriterProps(), {
						value: this,
						key: this.key
					})
				)
		);
		new Set(this.subscribers).forEach(
			(subscriber) => subscriber.onUpdating && subscriber.onUpdating(this)
		);
	};

	private onValueUpdated = () => {
		this.effects.forEach(
			(effect) =>
				effect.onUpdated &&
				effect.onUpdated(
					Object.assign(this.getPicoWriterProps(), {
						value: this,
						key: this.key
					})
				)
		);
		new Set(this.subscribers).forEach(
			(subscriber) => subscriber.onUpdated && subscriber.onUpdated(this)
		);
	};

	private getPicoWriterProps = (): PicoWriterProps => {
		return {
			get: <TState>(handler: InternalReadOnlyPicoHandler<TState>) =>
				handler.read(this.store).value as TState,
			getAsync: <TState>(handler: InternalReadOnlyPicoHandler<TState>) =>
				handler.read(this.store).promise ||
				Promise.resolve(handler.read(this.store).value as TState),
			set: (handler, value) => handler.save(this.store, value),
			reset: (handler) => handler.reset(this.store)
		};
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
}
