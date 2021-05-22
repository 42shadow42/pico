import { PicoStore } from '../store';
import { InternalReadOnlyPicoHandler } from './read-only';
import { ValueUpdater } from './value-updater';

export type InternalReadWritePicoHandler<
	TState
> = InternalReadOnlyPicoHandler<TState> & {
	save: (store: PicoStore, value: ValueUpdater<TState>) => void;
	reset: (store: PicoStore) => void;
};
