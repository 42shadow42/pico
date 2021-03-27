import isPromise from 'is-promise';
import { PicoValue, PicoValueSubscriber } from './value';

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
	private valueSubscriber: PicoValueSubscriber = {
		onUpdating: (key: string) => {
			new Set(this.subscribers).forEach(
				(subscriber) =>
					subscriber.onAtomUpdating && subscriber.onAtomUpdating(key)
			);
		},
		onUpdated: (key: string) => {
			new Set(this.subscribers).forEach(
				(subscriber) =>
					subscriber.onAtomUpdated && subscriber.onAtomUpdated(key)
			);
		}
	};

	createPicoValue = <TState>(
		key: string,
		valueOrPromise: TState | Promise<TState>
	): PicoValue<TState> => {
		const picoValue = new PicoValue<unknown>(key, valueOrPromise);

		this.treeState[key] = picoValue;

		if (isPromise(valueOrPromise)) {
			valueOrPromise.then(() => {
				this.onAtomCreated(key);
			});
		} else {
			this.onAtomCreated(key);
		}

		picoValue.subscribe(this.valueSubscriber);

		return picoValue as PicoValue<TState>;
	};

	deletePicoValue = (key: string) => {
		this.treeState[key]?.unsubscribe(this.valueSubscriber);
		this.onAtomDeleting(key);
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
