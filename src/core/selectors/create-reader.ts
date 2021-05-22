import { InternalReadOnlyPicoHandler } from '../handler';
import { ObservableSet } from '../observable-set';
import { PicoStore } from '../store';
import { isPicoErrorResult, isPicoPendingResult, PicoValue } from '../value';
import { SelectorSource } from './config';
import { SelectorLoader } from './loader';

export const createReader = <TState>(
	key: string,
	get: SelectorSource<TState>
) => (store: PicoStore): PicoValue<TState> => {
	let picoValue = store.resolve<TState>(key);
	if (picoValue) {
		return picoValue;
	}

	const loader: SelectorLoader<TState> = () => {
		const dependencies = new ObservableSet<PicoValue<unknown>>();
		const getValue = <TState>(
			handler: InternalReadOnlyPicoHandler<TState>
		) => {
			const picoValue = handler.read(store);
			dependencies.add(picoValue as PicoValue<unknown>);
			const result = picoValue.result;
			if (isPicoPendingResult(result)) throw result.promise;
			if (isPicoErrorResult(result)) throw result.error;
			return result.value;
		};
		const getValueAsync = <TState>(
			handler: InternalReadOnlyPicoHandler<TState>
		) => {
			const picoValue = handler.read(store);
			dependencies.add(picoValue as PicoValue<unknown>);
			const result = picoValue.result;
			if (isPicoPendingResult(result)) return result.promise;
			if (isPicoErrorResult(result)) return result.promise;
			return Promise.resolve(result.value);
		};

		const value = get({
			get: getValue,
			getAsync: getValueAsync
		});

		return {
			value,
			dependencies
		};
	};

	const { value, dependencies } = loader();
	picoValue = store.createPicoValue(
		key,
		'selector',
		value,
		[],
		dependencies,
		loader
	);

	return picoValue;
};
