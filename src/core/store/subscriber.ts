import { PicoValue } from '../value';

export type AtomCreatedHandler = (value: PicoValue<unknown>) => void;
export type AtomDeletingHandler = (value: PicoValue<unknown>) => void;
export type AtomUpdatingHandler = (value: PicoValue<unknown>) => void;
export type AtomUpdatedHandler = (value: PicoValue<unknown>) => void;

export interface PicoStoreSubscriber {
	onAtomCreated?: AtomCreatedHandler;
	onAtomDeleting?: AtomDeletingHandler;
	onAtomUpdating?: AtomUpdatingHandler;
	onAtomUpdated?: AtomUpdatedHandler;
}
