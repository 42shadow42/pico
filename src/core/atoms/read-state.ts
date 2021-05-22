import { PicoStore } from '../store';
import { DefaultValue, PicoEffect } from '../value';
import { resolveDefaultValue } from './resolve-default-value';

export function readState<TState>(
	store: PicoStore,
	key: string,
	defaultValue: DefaultValue<TState>,
	effects: PicoEffect<TState>[]
) {
	let { value, dependencies } = resolveDefaultValue(store, defaultValue);
	const picoValue = store.resolve<TState>(key);
	if (!picoValue) {
		return store.createPicoValue<TState>(
			key,
			'atom',
			value,
			effects,
			dependencies
		);
	}
	return picoValue;
}
