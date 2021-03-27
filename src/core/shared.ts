import {
	InternalReadOnlyPicoHandler,
	InternalReadWritePicoHandler
} from './handler';

export type SetPicoState = <TState>(
	handler: InternalReadWritePicoHandler<TState>,
	value: TState
) => void;
export type ResetPicoState = <TState>(
	handler: InternalReadWritePicoHandler<TState>
) => void;
export type GetPicoState = <TState>(
	handler: InternalReadOnlyPicoHandler<TState>
) => TState | undefined;
export type GetAsyncPicoState = <TState>(
	handler: InternalReadOnlyPicoHandler<TState>
) => Promise<TState | undefined>;

export interface PicoGetterProps {
	get: GetPicoState;
	getAsync: GetAsyncPicoState;
}
export type PicoWriterProps = PicoGetterProps & {
	set: SetPicoState;
	reset: ResetPicoState;
};
