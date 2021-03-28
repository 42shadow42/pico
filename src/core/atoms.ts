import {
	InternalReadWritePicoHandler,
	isInternalReadOnlyPicoHandler
} from './handler';
import { PicoStore } from './store';
import { PicoValue, PicoEffect } from './value';
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
	let value: TState | Promise<TState> | undefined;
	const dependencies = new Set<PicoValue<unknown>>();
	if (isInternalReadOnlyPicoHandler<TState>(defaultValue)) {
		const picoValue = defaultValue.read(store);
		dependencies.add(picoValue as PicoValue<unknown>);
		value = picoValue.promise || picoValue.value;
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
	let newValue: TState | Promise<TState> | undefined;
	let dependencies = new Set<PicoValue<unknown>>();
	if (isInternalReadOnlyPicoHandler<TState>(value)) {
		const dependency = value.read(store);
		newValue = dependency.promise || dependency.value;
		dependencies.add(dependency as PicoValue<unknown>);
	} else if (isFunction(value)) {
		newValue = value(
			readState<TState>(store, key, defaultValue, effects).value as TState
		);
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
	const picoValue = store.treeState[key] as PicoValue<TState> | undefined;
	if (picoValue) {
		picoValue.updateValue(value as TState | Promise<TState>);
	} else {
		store.createPicoValue(
			key,
			'atom',
			value as TState | Promise<TState>,
			effects,
			dependencies
		);
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
	const picoValue = store.treeState[key] as PicoValue<TState> | undefined;
	if (picoValue) {
		picoValue.updateValue(
			newValue as TState | Promise<TState>,
			dependencies
		);
	} else {
		store.createPicoValue(
			key,
			'atom',
			newValue as TState | Promise<TState>,
			effects,
			dependencies
		);
	}
}

function readState<TState>(
	store: PicoStore,
	key: string,
	defaultValue: DefaultValue<TState>,
	effects: PicoEffect<TState>[]
) {
	let { value, dependencies } = resolveDefaultValue(store, defaultValue);
	if (!store.treeState[key]) {
		return store.createPicoValue<TState>(
			key,
			'atom',
			value as TState | Promise<TState>,
			effects,
			dependencies
		);
	}
	return store.treeState[key] as PicoValue<TState>;
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
			resetState(store, key, defaultValue, effects)
	};
}

export function atomFamily<TState, TKey>({
	key,
	default: defaultValue,
	effects = []
}: AtomConfig<TState>) {
	return (id: TKey) =>
		atom({ key: `${key}::${id}`, default: defaultValue, effects });
}
