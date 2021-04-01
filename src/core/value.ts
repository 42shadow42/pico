import isPromise from 'is-promise';
import { InternalReadOnlyPicoHandler } from './handler';
import { SelectorLoader } from './selectors';
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

export class PicoValue<TState> {
	key: string;
	type: PicoValueType;
	value: TState | undefined;
	promise: PicoPromise<TState> | undefined;
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
		this.value = promiseOrValue;
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
			get: <TState>(handler: InternalReadOnlyPicoHandler<TState>) =>
				handler.read(this.store).value as TState,
			getAsync: <TState>(handler: InternalReadOnlyPicoHandler<TState>) =>
				handler.read(this.store).promise ||
				Promise.resolve(handler.read(this.store).value as TState),
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
				const { value, dependencies } = loader
					? loader()
					: {
							value: picoValue.value || picoValue.promise,
							dependencies: new Set<PicoValue<unknown>>([
								picoValue as PicoValue<unknown>
							])
					  };
				this.update(
					value as TState | Promise<TState>,
					dependencies,
					loader
				);
				dependencies.forEach((dependency) =>
					dependency.subscribe(watcher)
				);
			}
		};

		dependencies.forEach((dependency) => {
			dependency.subscribe(watcher);
		});

		this.dependencies = dependencies;
	};

	private updatePromise = (promise: Promise<TState>) => {
		const status: PromiseStatus = 'pending';
		this.value = undefined;
		this.error = undefined;
		this.promise = Object.assign(promise, { status });

		promise
			.then((value: TState) => {
				// Ignore results that aren't currently pending.
				if (this.promise !== promise) {
					return;
				}
				this.onValueUpdating();
				this.promise.status = 'resolved';
				this.value = value;
				this.error = undefined;
				this.onValueUpdated();
			})
			.catch(() => {});

		promise.catch((error: unknown) => {
			// Ignore results that aren't currently pending.
			if (this.promise !== promise) {
				return;
			}
			this.onValueUpdating();
			this.promise.status = 'rejected';
			this.error = error;
			this.value = undefined;
			this.onValueUpdated();
		});
	};
}
