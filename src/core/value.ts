import isPromise from 'is-promise';
import { result } from 'lodash';
import { InternalReadOnlyPicoHandler } from './handler';
import { SelectorLoader, SelectorLoaderResult } from './selectors';
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

export type PicoPromise<TState> = Promise<TState> & { status: PromiseStatus };

export type PicoPendingResult<TState> = {
	value: undefined;
	promise: PicoPromise<TState>;
	error: undefined;
};
export type PicoErrorResult<TState> = {
	value: undefined;
	promise: PicoPromise<TState>;
	error: unknown;
};
export type PicoValueResult<TState> = {
	value: TState;
	promise: PicoPromise<TState> | undefined;
	error: undefined;
};
export type PicoResult<TState> =
	| PicoPendingResult<TState>
	| PicoErrorResult<TState>
	| PicoValueResult<TState>;

export function isPicoPendingResult<TState>(
	result: PicoResult<TState>
): result is PicoPendingResult<TState> {
	return !!result.promise && result.promise.status === 'pending';
}

export function isPicoErrorResult<TState>(
	result: PicoResult<TState>
): result is PicoErrorResult<TState> {
	return !!result.promise && result.promise.status === 'rejected';
}

export function isPicoValueResult<TState>(
	result: PicoResult<TState>
): result is PicoValueResult<TState> {
	return !!result.value;
}

export class PicoValue<TState> {
	key: string;
	type: PicoValueType;
	result!: PicoResult<TState>;

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
		dependencies: Set<PicoValue<unknown>>,
		loader?: SelectorLoader<TState>
	) {
		this.key = key;
		this.type = type;
		this.store = store;
		this.effects = effects;
		this.dependencies = dependencies;

		this.update(promiseOrValue, dependencies, loader, false);
	}

	getEffects = () => [...this.effects];

	getDependencies = (): Set<PicoValue<unknown>> => {
		return new Set<PicoValue<unknown>>(this.dependencies);
	};

	update = (
		promiseOrValue: TState | Promise<TState>,
		dependencies: Set<PicoValue<unknown>>,
		loader?: SelectorLoader<TState>,
		fireEvents = true
	) => {
		this.updateDependencies(dependencies, loader);

		if (isPromise(promiseOrValue)) {
			this.updatePromise(promiseOrValue);
			return;
		}

		fireEvents && this.onValueUpdating();
		this.result = {
			value: promiseOrValue,
			promise: undefined,
			error: undefined
		};
		fireEvents && this.onValueUpdated();
	};

	subscribe = (subscriber: PicoValueSubscriber<TState>) => {
		this.subscribers.add(subscriber);
	};

	unsubscribe = (subscriber: PicoValueSubscriber<TState>) => {
		this.subscribers.delete(subscriber);
	};

	// public because creations are triggered by the store
	onCreated = () => {
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
			get: <TState>(handler: InternalReadOnlyPicoHandler<TState>) => {
				const result = handler.read(this.store).result;
				if (isPicoPendingResult(result)) throw result.promise;
				if (isPicoErrorResult(result)) throw result.error;
				return result.value;
			},
			getAsync: <TState>(
				handler: InternalReadOnlyPicoHandler<TState>
			) => {
				const result = handler.read(this.store).result;
				if (isPicoPendingResult(result)) return result.promise;
				if (isPicoErrorResult(result)) return result.promise;
				return Promise.resolve(result.value);
			},
			set: (handler, value) => handler.save(this.store, value),
			reset: (handler) => handler.reset(this.store)
		};
	};

	private updateDependencies = (
		dependencies: Set<PicoValue<unknown>>,
		loader?: SelectorLoader<TState>
	) => {
		const watcher: PicoValueSubscriber<any> = {
			onUpdated: async (picoValue: PicoValue<TState>) => {
				this.getDependencies().forEach((dependency) =>
					dependency.unsubscribe(watcher)
				);
				let result: SelectorLoaderResult<TState>;
				if (loader) {
					result = loader();
				} else if (
					isPicoPendingResult(picoValue.result) ||
					isPicoErrorResult(picoValue.result)
				) {
					result = {
						value: picoValue.result.promise,
						dependencies: new Set<PicoValue<unknown>>([
							picoValue as PicoValue<unknown>
						])
					};
				} else {
					result = {
						value: picoValue.result.value,
						dependencies: new Set<PicoValue<unknown>>([
							picoValue as PicoValue<unknown>
						])
					};
				}

				this.update(result.value, result.dependencies, loader);
			}
		};

		dependencies.forEach((dependency) => {
			dependency.subscribe(watcher);
		});

		this.dependencies = dependencies;
	};

	private updatePromise = (promise: Promise<TState>) => {
		const status: PromiseStatus = 'pending';
		this.result = {
			value: undefined,
			promise: Object.assign(promise, { status }),
			error: undefined
		};

		promise
			.then((value: TState) => {
				// Ignore results that aren't currently pending.
				if (this.result.promise !== promise) {
					return;
				}

				// this.onValueUpdating();
				const status: PromiseStatus = 'resolved';
				this.result = {
					value: value,
					promise: Object.assign(promise, { status }),
					error: undefined
				};
				// this.onValueUpdated();
			})
			.catch(() => {});

		promise.catch((error: unknown) => {
			// Ignore results that aren't currently pending.
			if (this.result.promise !== promise) {
				return;
			}
			// this.onValueUpdating();
			const status: PromiseStatus = 'rejected';
			this.result = {
				value: undefined,
				promise: Object.assign(promise, { status }),
				error: error
			};
			// this.onValueUpdated();
		});
	};
}

export function isPicoValue<T>(value: unknown): value is PicoValue<T> {
	const casted = value as PicoValue<T>;
	return casted.type === 'atom' || casted.type === 'selector';
}
