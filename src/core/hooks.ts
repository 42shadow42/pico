import { useContext, useEffect, useState } from 'react';
import {
	InternalReadWritePicoHandler,
	InternalReadOnlyPicoHandler
} from './handler';
import { InternalPicoContext } from './provider';
import { PicoValue, PromiseStatus } from './value';

export type PicoSetter<TState> = (value: TState) => void;
export type PicoState<TState> = [TState, PicoSetter<TState>];

export const usePicoValue = function <TState>(
	handler: InternalReadOnlyPicoHandler<TState>
): TState {
	const { value, subscribe, unsubscribe, promise, error } = useRawRecoilValue(
		handler
	);

	const [latestValue, setLatestValue] = useState<TState>(value as TState);
	const [latestPromise, setLatestPromise] = useState<
		(Promise<TState> & { status: PromiseStatus }) | undefined
	>(promise);
	const [latestError, setLatestError] = useState<unknown>(error);

	useEffect(() => {
		const callback = (
			value: TState,
			promise: (Promise<TState> & { status: PromiseStatus }) | undefined,
			error: unknown
		) => {
			setLatestValue(value);
			setLatestPromise(promise), setLatestError(error);
		};

		subscribe(callback);

		return () => unsubscribe(callback);
	}, [handler, subscribe, unsubscribe]);

	if (latestPromise && latestPromise.status === 'pending') {
		throw latestPromise;
	}

	if (latestPromise && latestPromise.status === 'rejected') {
		throw latestError;
	}

	return latestValue;
};

export const useSetPicoValue = function <TState>(
	handler: InternalReadWritePicoHandler<TState>
): PicoSetter<TState> {
	const store = useContext(InternalPicoContext);

	return (value: TState) => handler.save(store, value);
};

export const usePicoState = function <TState>(
	handler: InternalReadWritePicoHandler<TState>
): PicoState<TState> {
	return [usePicoValue(handler), useSetPicoValue(handler)];
};

export const useRawRecoilValue = function <TState>(
	handler: InternalReadOnlyPicoHandler<TState>
): PicoValue<TState> {
	const store = useContext(InternalPicoContext);

	return handler.read(store);
};
