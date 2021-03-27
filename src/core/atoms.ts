import {
	InternalReadOnlyPicoHandler,
	InternalReadWritePicoHandler,
	isInternalReadOnlyPicoHandler
} from './handler';
import { PicoStore } from './store';
import { PicoValue } from './value';

export interface AtomConfig<TState> {
	key: string;
	default: TState | InternalReadOnlyPicoHandler<TState>;
}

function resetState<TState>(
	store: PicoStore,
	key: string,
	defaultValue: TState | InternalReadOnlyPicoHandler<TState>
) {
	let value: TState | Promise<TState> | undefined;
	if (isInternalReadOnlyPicoHandler<TState>(defaultValue)) {
		const picoValue = defaultValue.read(store);
		value = picoValue.promise || picoValue.value;
	} else {
		value = defaultValue;
	}
	const picoValue = store.treeState[key] as PicoValue<TState> | undefined;
	picoValue
		? picoValue.updateValue(value as TState | Promise<TState>)
		: store.createPicoValue(key, value as TState);
}

function saveState<TState>(
	store: PicoStore,
	key: string,
	value: TState | InternalReadOnlyPicoHandler<TState>
) {
	let newValue: TState | Promise<TState> | undefined;
	let dependencies = new Set<PicoValue<unknown>>();
	if (isInternalReadOnlyPicoHandler<TState>(value)) {
		const dependency = value.read(store);
		newValue = dependency.promise || dependency.value;
		dependencies.add(dependency as PicoValue<unknown>);
	} else {
		newValue = value;
	}
	const picoValue = store.treeState[key] as PicoValue<TState> | undefined;
	picoValue
		? picoValue.updateValue(
				newValue as TState | Promise<TState>,
				dependencies
		  )
		: new PicoValue<unknown>(key, newValue, dependencies);
}

function readState<TState>(
	store: PicoStore,
	key: string,
	defaultValue: TState | InternalReadOnlyPicoHandler<TState>
) {
	let value: TState | Promise<TState> | undefined;
	if (isInternalReadOnlyPicoHandler<TState>(defaultValue)) {
		const picoValue = defaultValue.read(store);
		value = picoValue.promise || picoValue.value;
	} else {
		value = defaultValue;
	}
	if (!store.treeState[key]) {
		return store.createPicoValue<TState>(
			key,
			value as TState | Promise<TState>
		);
	}
	return store.treeState[key] as PicoValue<TState>;
}

export function atom<TState>({
	key,
	default: defaultValue
}: AtomConfig<TState>): InternalReadWritePicoHandler<TState> {
	return {
		read: (store: PicoStore): PicoValue<TState> =>
			readState<TState>(store, key, defaultValue),
		save: (store: PicoStore, value: TState) => saveState(store, key, value),
		reset: (store: PicoStore) => resetState(store, key, defaultValue)
	};
}

export function atomFamily<TState, TKey>({
	key,
	default: defaultValue
}: AtomConfig<TState>) {
	return (id: TKey) => atom({ key: `${key}::${id}`, default: defaultValue });
}
