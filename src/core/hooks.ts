import { useContext, useEffect, useState } from 'react';
import {
	InternalReadWritePicoHandler,
	InternalReadOnlyPicoHandler
} from './handler';
import { InternalPicoContext } from './provider';
import { PicoWriterProps, ValueUpdater } from './shared';
import {
	isPicoErrorResult,
	isPicoPendingResult,
	PicoResult,
	PicoValue,
	PicoValueSubscriber
} from './value';

export type PicoSetter<TState> = (value: ValueUpdater<TState>) => void;
export type PicoState<TState> = [TState, PicoSetter<TState>];
export type PicoCallback<T extends Function> = (props: PicoWriterProps) => T;

export const usePicoValue = function <TState>(
	handler: InternalReadOnlyPicoHandler<TState>
): TState {
	const store = useContext(InternalPicoContext);

	const { subscribe, unsubscribe, result } = handler.read(store);

	const [latestResult, setLatestResult] = useState<PicoResult<TState>>(
		result
	);

	useEffect(() => {
		const subcriber: PicoValueSubscriber<TState> = {
			onUpdated: ({ result }) => {
				setLatestResult(result);
			}
		};

		subscribe(subcriber);

		return () => unsubscribe(subcriber);
	}, [handler, subscribe, unsubscribe]);

	if (isPicoPendingResult(latestResult)) {
		throw latestResult.promise;
	}

	if (isPicoErrorResult(latestResult)) {
		throw latestResult.error;
	}

	return latestResult.value;
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
		get: <TState>(handler: InternalReadOnlyPicoHandler<TState>) => {
			const result = handler.read(store).result;
			if (isPicoPendingResult(result)) throw result.promise;
			if (isPicoErrorResult(result)) throw result.error;
			return result.value;
		},
		getAsync: <TState>(handler: InternalReadOnlyPicoHandler<TState>) => {
			const result = handler.read(store).result;
			if (isPicoPendingResult(result)) return result.promise;
			if (isPicoErrorResult(result)) return result.promise;
			return Promise.resolve(result.value);
		},
		set: <TState>(
			handler: InternalReadWritePicoHandler<TState>,
			value: ValueUpdater<TState>
		) => handler.save(store, value),
		reset: <TState>(handler: InternalReadWritePicoHandler<TState>) =>
			handler.reset(store)
	};
	return callback(props);
};
