import {
	InternalReadWritePicoHandler,
	isInternalReadOnlyPicoHandler
} from './handler';
import { PicoStore } from './store';
import { PicoValue } from './value';
import { isFunction } from 'lodash';
import { DefaultValue, PicoStoreEffect, ValueUpdater } from './shared';

export interface AtomConfig<TState> {
	key: string;
	default: DefaultValue<TState>;
	effects?: PicoStoreEffect<TState>[];
}

function resetState<TState>(
	store: PicoStore,
	key: string,
	defaultValue: DefaultValue<TState>,
	effects: PicoStoreEffect<TState>[]
) {
	let value: TState | Promise<TState> | undefined;
	if (isInternalReadOnlyPicoHandler<TState>(defaultValue)) {
		const picoValue = defaultValue.read(store);
		value = picoValue.promise || picoValue.value;
	} else if (isFunction(defaultValue)) {
		value = defaultValue();
	} else {
		value = defaultValue;
	}
	const picoValue = store.treeState[key] as PicoValue<TState> | undefined;
	picoValue
		? picoValue.updateValue(value as TState | Promise<TState>)
		: store.createPicoValue(
				key,
				value as TState | Promise<TState>,
				store.createPicoValueEffects(effects)
		  );
}

function saveState<TState>(
	store: PicoStore,
	key: string,
	value: ValueUpdater<TState>,
	defaultValue: DefaultValue<TState>,
	effects: PicoStoreEffect<TState>[]
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
	const picoValue = store.treeState[key] as PicoValue<TState> | undefined;
	picoValue
		? picoValue.updateValue(
				newValue as TState | Promise<TState>,
				dependencies
		  )
		: store.createPicoValue(
				key,
				newValue as TState | Promise<TState>,
				store.createPicoValueEffects(effects),
				dependencies
		  );
}

function readState<TState>(
	store: PicoStore,
	key: string,
	defaultValue: DefaultValue<TState>,
	effects: PicoStoreEffect<TState>[]
) {
	let value: TState | Promise<TState> | undefined;
	if (isInternalReadOnlyPicoHandler<TState>(defaultValue)) {
		const picoValue = defaultValue.read(store);
		value = picoValue.promise || picoValue.value;
	} else if (isFunction(defaultValue)) {
		value = defaultValue();
	} else {
		value = defaultValue;
	}
	if (!store.treeState[key]) {
		return store.createPicoValue<TState>(
			key,
			value as TState | Promise<TState>,
			store.createPicoValueEffects(effects)
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
