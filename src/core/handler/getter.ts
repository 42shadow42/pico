import { InternalReadOnlyPicoHandler } from './read-only';

export type GetPicoState = <TState>(
	handler: InternalReadOnlyPicoHandler<TState>
) => TState;
export type GetAsyncPicoState = <TState>(
	handler: InternalReadOnlyPicoHandler<TState>
) => Promise<TState>;

export interface PicoGetterProps {
	get: GetPicoState;
	getAsync: GetAsyncPicoState;
}
