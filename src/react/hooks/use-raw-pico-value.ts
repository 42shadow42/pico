import { useContext } from 'react';
import { InternalReadOnlyPicoHandler } from '../../core/handler';
import { InternalPicoContext } from '../provider';
import { PicoValue } from '../../core';

export const useRawPicoValue = function <TState>(
	handler: InternalReadOnlyPicoHandler<TState>
): PicoValue<TState> {
	const store = useContext(InternalPicoContext);

	return handler.read(store);
};
