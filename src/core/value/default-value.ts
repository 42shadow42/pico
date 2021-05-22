import { InternalReadOnlyPicoHandler } from '../handler';

export type DefaultValue<TState> =
	| TState
	| (() => TState | Promise<TState>)
	| Promise<TState>
	| InternalReadOnlyPicoHandler<TState>;
