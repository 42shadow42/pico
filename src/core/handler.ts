import { ValueUpdater } from './shared';
import { PicoStore } from './store';
import { PicoValue } from './value';

export interface InternalReadOnlyPicoHandler<TState> {
	read: (store: PicoStore) => PicoValue<TState>;
}

export type InternalReadWritePicoHandler<
	TState
> = InternalReadOnlyPicoHandler<TState> & {
	save: (store: PicoStore, value: ValueUpdater<TState>) => void;
	reset: (store: PicoStore) => void;
};

export function isInternalReadOnlyPicoHandler<TState>(
	handler: any
): handler is InternalReadOnlyPicoHandler<TState> {
	return handler.read !== undefined && typeof handler.read === 'function';
}

export function InternalReadWritePicoHandler<TState>(
	handler: any
): handler is InternalReadWritePicoHandler<TState> {
	return (
		handler.read !== undefined &&
		typeof handler.read === 'function' &&
		handler.save !== undefined &&
		typeof handler.save === 'function' &&
		handler.reset !== undefined &&
		typeof handler.reset === 'function'
	);
}
