import { InternalReadWritePicoHandler } from '../../core/handler';
import { usePicoValue } from './use-pico-value';
import { PicoSetter, useSetPicoValue } from './use-set-pico-value';

export type PicoState<TState> = [TState, PicoSetter<TState>];

export const usePicoState = function <TState>(
	handler: InternalReadWritePicoHandler<TState>
): PicoState<TState> {
	return [usePicoValue(handler), useSetPicoValue(handler)];
};
