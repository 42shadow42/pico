import {
	InternalReadWritePicoHandler,
	isInternalReadOnlyPicoHandler
} from './handler';
import { PicoStore } from './store';
import {
	PicoValue,
	PicoEffect,
	isPicoPendingResult,
	isPicoErrorResult
} from './value';
import { isFunction } from 'lodash';
import { DefaultValue, ValueUpdater } from './shared';

export interface AtomConfig<TState> {
	key: string;
	default: DefaultValue<TState>;
	effects?: PicoEffect<TState>[];
}

function resolveDefaultValue<TState>(
	store: PicoStore,
	defaultValue: DefaultValue<TState>
) {
	let value: TState | Promise<TState>;
	const dependencies = new Set<PicoValue<unknown>>();
	if (isInternalReadOnlyPicoHandler<TState>(defaultValue)) {
		const picoValue = defaultValue.read(store);
		dependencies.add(picoValue as PicoValue<unknown>);
		const result = picoValue.result;
		if (isPicoPendingResult(result)) value = result.promise;
		else if (isPicoErrorResult(result)) throw result.error;
		else value = result.value;
	} else if (isFunction(defaultValue)) {
		value = defaultValue();
	} else {
		value = defaultValue;
	}

	return { value, dependencies };
}

function resolveValueUpdater<TState>(
	store: PicoStore,
	key: string,
	value: ValueUpdater<TState>,
	defaultValue: DefaultValue<TState>,
	effects: PicoEffect<TState>[]
) {
	let newValue: TState | Promise<TState>;
	let dependencies = new Set<PicoValue<unknown>>();
	if (isInternalReadOnlyPicoHandler<TState>(value)) {
		const picoValue = value.read(store);
		const result = picoValue.result;
		if (isPicoPendingResult(result)) newValue = result.promise;
		else if (isPicoErrorResult(result)) throw result.error;
		else newValue = result.value;
		dependencies.add(picoValue as PicoValue<unknown>);
	} else if (isFunction(value)) {
		const picoValue = readState<TState>(store, key, defaultValue, effects);
		const result = picoValue.result;
		if (isPicoPendingResult(result))
			newValue = result.promise.then((newValue) => value(newValue));
		else if (isPicoErrorResult(result)) throw result.error;
		else newValue = value(result.value);
	} else {
		newValue = value;
	}

	return { newValue, dependencies };
}

function resetState<TState>(
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

function saveState<TState>(
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

function readState<TState>(
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
