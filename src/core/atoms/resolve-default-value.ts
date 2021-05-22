import { isFunction } from 'lodash';
import { isInternalReadOnlyPicoHandler } from '../handler';
import { ObservableSet } from '../observable-set';
import { PicoStore } from '../store';
import {
	DefaultValue,
	isPicoErrorResult,
	isPicoPendingResult,
	PicoValue
} from '../value';

export function resolveDefaultValue<TState>(
	store: PicoStore,
	defaultValue: DefaultValue<TState>
) {
	let value: TState | Promise<TState>;
	const dependencies = new ObservableSet<PicoValue<unknown>>();
	if (isInternalReadOnlyPicoHandler<TState>(defaultValue)) {
		const picoValue = defaultValue.read(store);
		dependencies.add(picoValue as PicoValue<unknown>);
		const result = picoValue.result;
		if (isPicoPendingResult(result)) value = result.promise;
		else if (isPicoErrorResult(result)) throw result.error;
		else value = result.value;
	} else if (isFunction(defaultValue)) {
		value = defaultValue();
	} else {
		value = defaultValue;
	}

	return { value, dependencies };
}
