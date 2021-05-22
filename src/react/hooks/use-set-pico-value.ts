import { useContext } from 'react';
import { ValueUpdater } from '../../core';
import { InternalReadWritePicoHandler } from '../../core/handler';
import { InternalPicoContext } from '../provider';

export type PicoSetter<TState> = (value: ValueUpdater<TState>) => void;

export const useSetPicoValue = function <TState>(
	handler: InternalReadWritePicoHandler<TState>
): PicoSetter<TState> {
	const store = useContext(InternalPicoContext);

	return (value: ValueUpdater<TState>) => handler.save(store, value);
};
