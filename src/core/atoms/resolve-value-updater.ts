import { isFunction } from 'lodash';
import { isInternalReadOnlyPicoHandler, ValueUpdater } from '../handler';
import { ObservableSet } from '../observable-set';
import { PicoStore } from '../store';
import {
	DefaultValue,
	isPicoErrorResult,
	isPicoPendingResult,
	PicoEffect,
	PicoValue
} from '../value';
import { readState } from './read-state';

export function resolveValueUpdater<TState>(
	store: PicoStore,
	key: string,
	value: ValueUpdater<TState>,
	defaultValue: DefaultValue<TState>,
	effects: PicoEffect<TState>[]
) {
	let newValue: TState | Promise<TState>;
	let dependencies = new ObservableSet<PicoValue<unknown>>();
	if (isInternalReadOnlyPicoHandler<TState>(value)) {
		const picoValue = value.read(store);
		const result = picoValue.result;
		if (isPicoPendingResult(result)) newValue = result.promise;
		else if (isPicoErrorResult(result)) throw result.error;
		else newValue = result.value;
		dependencies.add(picoValue as PicoValue<unknown>);
	} else if (isFunction(value)) {
		const result = readState<TState>(store, key, defaultValue, effects)
			.result;
		if (isPicoPendingResult(result))
			newValue = result.promise.then((newValue) => value(newValue));
		else if (isPicoErrorResult(result)) throw result.error;
		else newValue = value(result.value);
	} else {
		newValue = value;
	}

	return { newValue, dependencies };
}
