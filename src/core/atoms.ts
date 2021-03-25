import {
	InternalReadOnlyPicoHandler,
	InternalReadWritePicoHandler,
	isInternalReadOnlyPicoHandler
} from './handler';
import { InternalTreeState } from './tree-state';
import { PicoValue } from './value';

export interface AtomConfig<TState> {
	key: string;
	default: TState | InternalReadOnlyPicoHandler<TState>;
}

function resetState<TState>(
	state: InternalTreeState,
	key: string,
	defaultValue: TState | InternalReadOnlyPicoHandler<TState>
) {
	let value: TState | Promise<TState> | undefined;
	if (isInternalReadOnlyPicoHandler<TState>(defaultValue)) {
		const picoValue = defaultValue.read(state);
		value = picoValue.promise || picoValue.value;
	} else {
		value = defaultValue;
	}
	state[key]
		? state[key].updateValue(value)
		: (state[key] = new PicoValue<unknown>(value));
	state[key].notify();
}

function saveState<TState>(
	state: InternalTreeState,
	key: string,
	value: TState | InternalReadOnlyPicoHandler<TState>
) {
	let newValue: TState | Promise<TState> | undefined;
	let dependencies = new Set<PicoValue<unknown>>();
	if (isInternalReadOnlyPicoHandler<TState>(value)) {
		const dependency = value.read(state);
		newValue = dependency.promise || dependency.value;
		dependencies.add(dependency as PicoValue<unknown>);
	} else {
		newValue = value;
	}
	state[key]
		? state[key].updateValue(newValue, dependencies)
		: (state[key] = new PicoValue<unknown>(newValue, dependencies));
}

function readState<TState>(
	state: InternalTreeState,
	key: string,
	defaultValue: TState | InternalReadOnlyPicoHandler<TState>
) {
	let value: TState | Promise<TState> | undefined;
	if (isInternalReadOnlyPicoHandler<TState>(defaultValue)) {
		const picoValue = defaultValue.read(state);
		value = picoValue.promise || picoValue.value;
	} else {
		value = defaultValue;
	}
	if (!state[key]) {
		state[key] = new PicoValue<unknown>(value);
	}
	return state[key] as PicoValue<TState>;
}

export function atom<TState>({
	key,
	default: defaultValue
}: AtomConfig<TState>): InternalReadWritePicoHandler<TState> {
	return {
		read: (treeState: InternalTreeState): PicoValue<TState> =>
			readState<TState>(treeState, key, defaultValue),
		save: (treeState: InternalTreeState, value: TState) =>
			saveState(treeState, key, value),
		reset: (treeState: InternalTreeState) =>
			resetState(treeState, key, defaultValue)
	};
}

export function atomFamily<TState, TKey>({
	key,
	default: defaultValue
}: AtomConfig<TState>) {
	return (id: TKey) => atom({ key: `${key}::${id}`, default: defaultValue });
}
