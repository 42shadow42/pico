import { useContext, useEffect, useState } from 'react';
import {
	InternalReadWritePicoHandler,
	InternalReadOnlyPicoHandler
} from './handler';
import { InternalPicoContext } from './provider';
import { PicoWriterProps, ValueUpdater } from './shared';
import { PicoValue, PicoValueSubscriber, PromiseStatus } from './value';

export type PicoSetter<TState> = (value: ValueUpdater<TState>) => void;
export type PicoState<TState> = [TState, PicoSetter<TState>];
export type PicoCallback<T extends Function> = (props: PicoWriterProps) => T;

export const usePicoValue = function <TState>(
	handler: InternalReadOnlyPicoHandler<TState>
): TState {
	const store = useContext(InternalPicoContext);

	const { value, subscribe, unsubscribe, promise, error } = handler.read(
		store
	);

	const [latestValue, setLatestValue] = useState<TState>(value as TState);
	const [latestPromise, setLatestPromise] = useState<
		(Promise<TState> & { status: PromiseStatus }) | undefined
	>(promise);
	const [latestError, setLatestError] = useState<unknown>(error);

	useEffect(() => {
		const subcriber: PicoValueSubscriber = {
			onUpdated: () => {
				const { value, promise, error } = handler.read(store);
				setLatestValue(value as TState);
				setLatestPromise(promise), setLatestError(error);
			}
		};

		subscribe(subcriber);

		return () => unsubscribe(subcriber);
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

	return (value: ValueUpdater<TState>) => handler.save(store, value);
};

export const usePicoState = function <TState>(
	handler: InternalReadWritePicoHandler<TState>
): PicoState<TState> {
	return [usePicoValue(handler), useSetPicoValue(handler)];
};

export const useRawPicoValue = function <TState>(
	handler: InternalReadOnlyPicoHandler<TState>
): PicoValue<TState> {
	const store = useContext(InternalPicoContext);

	return handler.read(store);
};

export const usePicoCallback = function <TFunction extends Function>(
	callback: PicoCallback<TFunction>
): TFunction {
	const store = useContext(InternalPicoContext);
	const props: PicoWriterProps = {
		get: <TState>(handler: InternalReadOnlyPicoHandler<TState>) =>
			handler.read(store).value as TState,
		getAsync: <TState>(handler: InternalReadOnlyPicoHandler<TState>) =>
			handler.read(store).promise ||
			Promise.resolve(handler.read(store).value as TState),
		set: <TState>(
			handler: InternalReadWritePicoHandler<TState>,
			value: ValueUpdater<TState>
		) => handler.save(store, value),
		reset: <TState>(handler: InternalReadWritePicoHandler<TState>) =>
			handler.reset(store)
	};
	return callback(props);
};
