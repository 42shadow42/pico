import { useContext, useEffect, useState } from 'react';
import { InternalReadOnlyPicoHandler } from '../../core/handler';
import { InternalPicoContext } from '../provider';
import {
	isPicoErrorResult,
	isPicoPendingResult,
	PicoValueSubscriber,
	PicoResult
} from '../../core';

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
