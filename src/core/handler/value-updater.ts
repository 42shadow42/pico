import { InternalReadOnlyPicoHandler } from './read-only';

export type ValueUpdater<TState> =
	| TState
	| ((current: TState) => TState | Promise<TState>)
	| Promise<TState>
	| InternalReadOnlyPicoHandler<TState>;
