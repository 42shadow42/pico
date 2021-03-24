import { InternalTreeState } from './tree-state';
import { PicoValue } from './value';

export interface InternalReadOnlyPicoHandler<TState> {
	read: (treeState: InternalTreeState) => PicoValue<TState>;
}

export type InternalReadWritePicoHandler<
	TState
> = InternalReadOnlyPicoHandler<TState> & {
	save: (treeState: InternalTreeState, value: TState) => void;
	reset: (treeState: InternalTreeState) => void;
};
