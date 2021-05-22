import { InternalReadWritePicoHandler, ValueUpdater } from '../handler';
import { PicoStore } from '../store';
import { PicoValue } from '../value';
import { AtomConfig } from './atom-config';
import { readState } from './read-state';
import { resetState } from './reset-state';
import { saveState } from './save-state';

export function atom<TState>({
	key,
	default: defaultValue,
	effects = []
}: AtomConfig<TState>): InternalReadWritePicoHandler<TState> {
	return {
		read: (store: PicoStore): PicoValue<TState> =>
			readState<TState>(store, key, defaultValue, effects),
		save: (store: PicoStore, value: ValueUpdater<TState>) =>
			saveState(store, key, value, defaultValue, effects),
		reset: (store: PicoStore) =>
			resetState(store, key, defaultValue, effects),
		delete: (store: PicoStore) => store.deletePicoValue(key)
	};
}
