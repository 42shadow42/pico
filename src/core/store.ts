import isPromise from 'is-promise';
import { InternalReadOnlyPicoHandler } from './handler';
import { PicoStoreEffect, PicoWriterProps } from './shared';
import { PicoValue, PicoValueEffect, PicoValueSubscriber } from './value';

export interface InternalTreeState {
	[key: string]: PicoValue<unknown> | undefined;
}

type AtomCreatedHandler = (key: string) => void;
type AtomDeletingHandler = (key: string) => void;
type AtomUpdatingHandler = (key: string) => void;
type AtomUpdatedHandler = (key: string) => void;

export interface PicoStoreSubscriber {
	onAtomCreated?: AtomCreatedHandler;
	onAtomDeleting?: AtomDeletingHandler;
	onAtomUpdating?: AtomUpdatingHandler;
	onAtomUpdated?: AtomUpdatedHandler;
}

export class PicoStore {
	treeState: InternalTreeState = {};
	private subscribers = new Set<PicoStoreSubscriber>();
	private valueSubscriber: PicoValueSubscriber<any> = {
		onUpdating: (value, key: string) => {
			new Set(this.subscribers).forEach(
				(subscriber) =>
					subscriber.onAtomUpdating && subscriber.onAtomUpdating(key)
			);
		},
		onUpdated: (value, key: string) => {
			new Set(this.subscribers).forEach(
				(subscriber) =>
					subscriber.onAtomUpdated && subscriber.onAtomUpdated(key)
			);
		}
	};

	createPicoValueEffects = <TState>(
		storeEffects: PicoStoreEffect<TState>[]
	) => {
		const picoWriterProps: PicoWriterProps = {
			get: <TState>(handler: InternalReadOnlyPicoHandler<TState>) =>
				handler.read(this).value as TState,
			getAsync: <TState>(handler: InternalReadOnlyPicoHandler<TState>) =>
				handler.read(this).promise ||
				Promise.resolve(handler.read(this).value as TState),
			set: (handler, value) => handler.save(this, value),
			reset: (handler) => handler.reset(this)
		};
		return storeEffects.map((effect) => {
			return {
				onCreated: effect.onCreated?.bind(null, picoWriterProps),
				onUpdating: effect.onUpdating?.bind(null, picoWriterProps),
				onUpdated: effect.onUpdated?.bind(null, picoWriterProps),
				onDeleting: effect.onDeleting?.bind(null, picoWriterProps)
			};
		});
	};

	createPicoValue = <TState>(
		key: string,
		valueOrPromise: TState | Promise<TState>,
		effects: PicoValueEffect<TState>[],
		dependencies?: Set<PicoValue<unknown>>
	): PicoValue<TState> => {
		const picoValue = new PicoValue<TState>(
			key,
			valueOrPromise,
			effects,
			dependencies
		);

		this.treeState[key] = picoValue as PicoValue<unknown>;

		if (isPromise(valueOrPromise)) {
			valueOrPromise.then(() => {
				this.onAtomCreated(key);
			});
		} else {
			this.onAtomCreated(key);
		}

		picoValue.subscribe(this.valueSubscriber);

		return picoValue;
	};

	deletePicoValue = (key: string) => {
		this.treeState[key]?.unsubscribe(this.valueSubscriber);
		this.onAtomDeleting(key);
		this.treeState[key]?.internalDelete();
		this.treeState[key] = undefined;
	};

	onAtomCreated = (key: string) => {
		new Set<PicoStoreSubscriber>(this.subscribers).forEach(
			(subscriber) =>
				subscriber.onAtomCreated && subscriber.onAtomCreated(key)
		);
	};

	onAtomDeleting = (key: string) => {
		new Set<PicoStoreSubscriber>(this.subscribers).forEach(
			(subscriber) =>
				subscriber?.onAtomDeleting && subscriber.onAtomDeleting(key)
		);
	};

	subscribe = (subscriber: PicoStoreSubscriber) => {
		this.subscribers.add(subscriber);
	};

	unsubscribe = (subscriber: PicoStoreSubscriber) => {
		this.subscribers.delete(subscriber);
	};
}
