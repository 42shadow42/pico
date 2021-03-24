import { useContext, useEffect, useState } from 'react';
import { InternalPicoHandler } from './atoms';
import { InternalPicoContext } from './provider';
import { PicoValue } from './value';

export type PicoSetter<TState> = (value: TState) => void;
export type PicoState<TState> = [TState, PicoSetter<TState>];

export const usePicoValue = function <TState>(
	handler: InternalPicoHandler<TState>
): TState {
	const { value, subscribe, unsubscribe, promise } = useRawRecoilValue(
		handler
	);

	const [state, setState] = useState<TState>(value as TState);

	useEffect(() => {
		const callback = setState;

		subscribe(callback);

		return () => unsubscribe(callback);
	}, [handler, subscribe, unsubscribe]);

	if (promise && promise.status === 'pending') {
		throw promise;
	}

	if (promise && promise.status === 'rejected') {
		throw 'error';
	}

	return state;
};

export const useSetPicoValue = function <TState>(
	handler: InternalPicoHandler<TState>
): PicoSetter<TState> {
	const store = useContext(InternalPicoContext);

	return (value: TState) => handler.save(store, value);
};

export const usePicoState = function <TState>(
	handler: InternalPicoHandler<TState>
): PicoState<TState> {
	return [usePicoValue(handler), useSetPicoValue(handler)];
};

export const useRawRecoilValue = function <TState>(
	handler: InternalPicoHandler<TState>
): PicoValue<TState> {
	const store = useContext(InternalPicoContext);

	return handler.read(store);
};
