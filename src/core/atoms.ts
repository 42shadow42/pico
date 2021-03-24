import { InternalTreeState } from './tree-state';
import { PicoValue } from './value';

export interface AtomConfig<TState> {
	key: string;
	default: TState;
}

export interface InternalPicoHandler<TState> {
	read: (treeState: InternalTreeState) => PicoValue<TState>;
	save: (treeState: InternalTreeState, value: TState) => void;
}

function saveState<TState>(
	state: InternalTreeState,
	key: string,
	value: TState
) {
	state[key]
		? (state[key].value = value)
		: (state[key] = new PicoValue<unknown>(value));
	state[key].notify();
}

function readState<TState>(
	state: InternalTreeState,
	key: string,
	defaultValue: TState
) {
	if (!state[key]) {
		state[key] = new PicoValue<unknown>(defaultValue);
	}
	return state[key] as PicoValue<TState>;
}

export function atom<TState>({
	key,
	default: defaultValue
}: AtomConfig<TState>): InternalPicoHandler<TState> {
	return {
		read: (treeState: InternalTreeState): PicoValue<TState> =>
			readState<TState>(treeState, key, defaultValue),
		save: (treeState: InternalTreeState, value: TState) =>
			saveState(treeState, key, value)
	};
}

export function atomFamily<TState, TKey>({
	key,
	default: defaultValue
}: AtomConfig<TState>) {
	return (id: TKey) => atom({ key: `${key}::${id}`, default: defaultValue });
}
