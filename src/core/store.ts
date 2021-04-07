import isPromise from 'is-promise';
import { SelectorLoader } from './selectors';
import {
	PicoValue,
	PicoEffect,
	PicoValueSubscriber,
	PicoValueType,
	isPicoValue
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

	createPicoValue = <TState>(
		key: string,
		type: PicoValueType,
		valueOrPromise: TState | Promise<TState>,
		effects: PicoEffect<TState>[],
		dependencies: Set<PicoValue<unknown>>,
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
		const tokens = key.split('::');
		if (tokens.length === 1) {
			this.treeState[tokens[0]] = picoValue as PicoValue<unknown>;
		} else {
			let family = this.treeState[tokens[0]] as PicoFamily<unknown>;
			if (!family) family = this.treeState[tokens[0]] = {};
			family[tokens[1]] = picoValue as PicoValue<unknown>;
		}

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
		const tokens = key.split('::');
		if (tokens.length === 1)
			return this.treeState[tokens[0]] as PicoValue<TState> | undefined;
		const family = this.treeState[tokens[0]] as
			| PicoFamily<TState>
			| undefined;
		if (family) return family[tokens[1]] as PicoValue<TState> | undefined;
		return undefined;
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
