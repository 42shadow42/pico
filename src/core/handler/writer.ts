import { PicoGetterProps } from './getter';
import { InternalReadOnlyPicoHandler } from './read-only';
import { InternalReadWritePicoHandler } from './read-write';
import { ValueUpdater } from './value-updater';

export type SetPicoState = <TState>(
	handler: InternalReadWritePicoHandler<TState>,
	value: ValueUpdater<TState>
) => void;
export type ResetPicoState = <TState>(
	handler: InternalReadWritePicoHandler<TState>
) => void;
export type DeletePicoState = <TState>(
	handler: InternalReadOnlyPicoHandler<TState>
) => void;

export type PicoWriterProps = PicoGetterProps & {
	set: SetPicoState;
	reset: ResetPicoState;
	delete: DeletePicoState;
};
