import { PicoPromise } from './pico-promise';

export type PicoPendingResult<TState> = {
	value: undefined;
	promise: PicoPromise<TState>;
	error: undefined;
};
export type PicoErrorResult<TState> = {
	value: undefined;
	promise: PicoPromise<TState>;
	error: unknown;
};
export type PicoValueResult<TState> = {
	value: TState;
	promise: PicoPromise<TState> | undefined;
	error: undefined;
};
export type PicoResult<TState> =
	| PicoPendingResult<TState>
	| PicoErrorResult<TState>
	| PicoValueResult<TState>;

export function isPicoPendingResult<TState>(
	result: PicoResult<TState>
): result is PicoPendingResult<TState> {
	return !!result.promise && result.promise.status === 'pending';
}

export function isPicoErrorResult<TState>(
	result: PicoResult<TState>
): result is PicoErrorResult<TState> {
	return !!result.promise && result.promise.status === 'rejected';
}

export function isPicoValueResult<TState>(
	result: PicoResult<TState>
): result is PicoValueResult<TState> {
	return !!result.value;
}
