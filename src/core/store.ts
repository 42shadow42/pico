import isPromise from 'is-promise';
import { InternalReadOnlyPicoHandler } from './handler';
import { ObservableSet } from './observable-set';
import { SelectorLoader } from './selectors';
import { PicoWriterProps } from './shared';
import {
	PicoValue,
	PicoEffect,
	PicoValueSubscriber,
	PicoValueType,
	isPicoValue,
	isPicoPendingResult,
	isPicoErrorResult
} from './value';

export interface PicoFamily<T> {
	[key: string]: PicoValue<T> | undefined;
}

export interface InternalTreeState {
	[key: string]: PicoValue<unknown> | PicoFamily<unknown> | undefined;
}

type AtomCreatedHandler = (value: PicoValue<unknown>) => void;
type AtomDeletingHandler = (value: PicoValue<unknown>) => void;
type AtomUpdatingHandler = (value: PicoValue<unknown>) => void;
type AtomUpdatedHandler = (value: PicoValue<unknown>) => void;

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
		onUpdating: (picoValue) => {
			new Set(this.subscribers).forEach(
				(subscriber) =>
					subscriber.onAtomUpdating &&
					subscriber.onAtomUpdating(picoValue)
			);
		},
		onUpdated: (picoValue) => {
			new Set(this.subscribers).forEach(
				(subscriber) =>
					subscriber.onAtomUpdated &&
					subscriber.onAtomUpdated(picoValue)
			);
		}
	};

	getPicoWriterProps = (): PicoWriterProps => {
		return {
			get: <TState>(handler: InternalReadOnlyPicoHandler<TState>) => {
				const result = handler.read(this).result;
				if (isPicoPendingResult(result)) throw result.promise;
				if (isPicoErrorResult(result)) throw result.error;
				return result.value;
			},
			getAsync: <TState>(
				handler: InternalReadOnlyPicoHandler<TState>
			) => {
				const result = handler.read(this).result;
				if (isPicoPendingResult(result)) return result.promise;
				if (isPicoErrorResult(result)) return result.promise;
				return Promise.resolve(result.value);
			},
			set: (handler, value) => handler.save(this, value),
			reset: (handler) => handler.reset(this),
			delete: (handler) => handler.delete(this)
		};
	};

	createPicoValue = <TState>(
		key: string,
		type: PicoValueType,
		valueOrPromise: TState | Promise<TState>,
		effects: PicoEffect<TState>[],
		dependencies: ObservableSet<PicoValue<unknown>>,
		loader?: SelectorLoader<TState>
	): PicoValue<TState> => {
		const picoValue = new PicoValue<TState>(
			key,
			type,
			this,
			valueOrPromise,
			effects,
			dependencies,
			loader
		);
		this.treeState[key] = picoValue as PicoValue<unknown>;

		picoValue.onCreated();

		if (isPromise(valueOrPromise)) {
			valueOrPromise
				.then(() => {
					this.onAtomCreated(picoValue as PicoValue<unknown>);
				})
				.catch(() => {});
		} else {
			this.onAtomCreated(picoValue as PicoValue<unknown>);
		}

		picoValue.subscribe(this.valueSubscriber);

		return picoValue;
	};

	resolve = <TState>(key: string) => {
		return this.treeState[key] as PicoValue<TState> | undefined;
	};

	deletePicoValue = (key: string) => {
		const value = this.treeState[key];
		if (value && isPicoValue(value)) {
			value.unsubscribe(this.valueSubscriber);
			value && this.onAtomDeleting(value);
			value.onDeleting();
		}
		this.treeState[key] = undefined;
	};

	onAtomCreated = (value: PicoValue<unknown>) => {
		if (value.type === 'atom') {
			new Set<PicoStoreSubscriber>(this.subscribers).forEach(
				(subscriber) =>
					subscriber.onAtomCreated && subscriber.onAtomCreated(value)
			);
		}
	};

	onAtomDeleting = (value: PicoValue<unknown>) => {
		new Set<PicoStoreSubscriber>(this.subscribers).forEach(
			(subscriber) =>
				subscriber?.onAtomDeleting && subscriber.onAtomDeleting(value)
		);
	};

	subscribe = (subscriber: PicoStoreSubscriber) => {
		this.subscribers.add(subscriber);
	};

	unsubscribe = (subscriber: PicoStoreSubscriber) => {
		this.subscribers.delete(subscriber);
	};
}
