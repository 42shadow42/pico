import { PicoStore } from '../store';
import { DefaultValue, PicoEffect } from '../value';
import { resolveDefaultValue } from './resolve-default-value';

export function resetState<TState>(
	store: PicoStore,
	key: string,
	defaultValue: DefaultValue<TState>,
	effects: PicoEffect<TState>[]
) {
	const { value, dependencies } = resolveDefaultValue(store, defaultValue);
	const picoValue = store.resolve<TState>(key);
	if (picoValue) {
		picoValue.update(value, dependencies);
	} else {
		store.createPicoValue(key, 'atom', value, effects, dependencies);
	}
}
