import { PicoStore } from '../store';
import { PicoValue } from '../value';

export interface InternalReadOnlyPicoHandler<TState> {
	read: (store: PicoStore) => PicoValue<TState>;
	delete: (store: PicoStore) => void;
}

export function isInternalReadOnlyPicoHandler<TState>(
	handler: any
): handler is InternalReadOnlyPicoHandler<TState> {
	return (
		handler &&
		handler.read !== undefined &&
		typeof handler.read === 'function'
	);
}
