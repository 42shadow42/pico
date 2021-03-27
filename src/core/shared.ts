import {
	InternalReadOnlyPicoHandler,
	InternalReadWritePicoHandler
} from './handler';
import { PicoValue } from './value';

export type DefaultValue<TState> =
	| TState
	| (() => TState | Promise<TState>)
	| Promise<TState>
	| InternalReadOnlyPicoHandler<TState>;
export type ValueUpdater<TState> =
	| TState
	| ((current: TState) => TState | Promise<TState>)
	| Promise<TState>
	| InternalReadOnlyPicoHandler<TState>;

export type SetPicoState = <TState>(
	handler: InternalReadWritePicoHandler<TState>,
	value: ValueUpdater<TState>
) => void;
export type ResetPicoState = <TState>(
	handler: InternalReadWritePicoHandler<TState>
) => void;
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
export type PicoWriterProps = PicoGetterProps & {
	set: SetPicoState;
	reset: ResetPicoState;
};

export type PicoStoreEffect<TState> = {
	onCreated?: (
		props: PicoWriterProps,
		value: PicoValue<TState>,
		key: string
	) => void;
	onDeleting?: (
		props: PicoWriterProps,
		value: PicoValue<TState>,
		key: string
	) => void;
	onUpdating?: (
		props: PicoWriterProps,
		value: PicoValue<TState>,
		key: string
	) => void;
	onUpdated?: (
		props: PicoWriterProps,
		value: PicoValue<TState>,
		key: string
	) => void;
};
