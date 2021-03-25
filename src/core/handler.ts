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
