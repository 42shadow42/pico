import { ValueUpdater } from '../handler';
import { PicoStore } from '../store';
import { DefaultValue, PicoEffect } from '../value';
import { resolveValueUpdater } from './resolve-value-updater';

export function saveState<TState>(
	store: PicoStore,
	key: string,
	value: ValueUpdater<TState>,
	defaultValue: DefaultValue<TState>,
	effects: PicoEffect<TState>[]
) {
	const { newValue, dependencies } = resolveValueUpdater(
		store,
		key,
		value,
		defaultValue,
		effects
	);
	const picoValue = store.resolve<TState>(key);
	if (picoValue) {
		picoValue.update(newValue, dependencies);
	} else {
		store.createPicoValue(key, 'atom', newValue, effects, dependencies);
	}
}
