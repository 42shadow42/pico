import isPromise from 'is-promise';
import {
	PicoValue,
	PicoEffect,
	PicoValueSubscriber,
	PicoValueType
} from './value';

export interface InternalTreeState {
	[key: string]: PicoValue<unknown> | undefined;
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
		dependencies?: Set<PicoValue<unknown>>
	): PicoValue<TState> => {
		const picoValue = new PicoValue<TState>(
			key,
			type,
			this,
			valueOrPromise,
			effects,
			dependencies
		);

		this.treeState[key] = picoValue as PicoValue<unknown>;

		if (isPromise(valueOrPromise)) {
			valueOrPromise
				.then(() => {
					this.onValueCreated(picoValue as PicoValue<unknown>);
				})
				.catch(() => {});
		} else {
			this.onValueCreated(picoValue as PicoValue<unknown>);
		}

		picoValue.subscribe(this.valueSubscriber);

		return picoValue;
	};

	deletePicoValue = (key: string) => {
		const value = this.treeState[key];
		if (value) {
			value.unsubscribe(this.valueSubscriber);
			value && this.onAtomDeleting(value);
			value.onDeleting();
		}
		this.treeState[key] = undefined;
	};

	onValueCreated = (value: PicoValue<unknown>) => {
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
