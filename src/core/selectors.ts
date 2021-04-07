import isPromise from 'is-promise';
import {
	InternalReadOnlyPicoHandler,
	InternalReadWritePicoHandler
} from './handler';
import { PicoGetterProps, PicoWriterProps, ValueUpdater } from './shared';
import { PicoStore } from './store';
import { isPicoErrorResult, isPicoPendingResult, PicoValue } from './value';

export type SelectorSource<TState> = (
	props: PicoGetterProps
) => TState | Promise<TState>;
export type SelectorWriter<TState> = (
	props: PicoWriterProps,
	value: ValueUpdater<TState>
) => void;
export type SelectorReset = (props: PicoWriterProps) => void;

export interface ReadOnlySelectorConfig<TState> {
	key: string;
	get: SelectorSource<TState>;
}

export type ReadWriteSelectorConfig<TState> = ReadOnlySelectorConfig<TState> & {
	set: SelectorWriter<TState>;
	reset: SelectorReset;
};

export interface ReadOnlySelectorFamilyConfig<TState, TKey> {
	key: string;
	get: (key: TKey) => SelectorSource<TState>;
}

export type ReadWriteSelectorFamilyConfig<
	TState,
	TKey
> = ReadOnlySelectorFamilyConfig<TState, TKey> & {
	set: (key: TKey) => SelectorWriter<TState>;
	reset: (key: TKey) => SelectorReset;
};

export interface SelectorLoaderResult<TState> {
	value: TState | Promise<TState>;
	dependencies: Set<PicoValue<unknown>>;
}
export type SelectorLoader<TState> = () => SelectorLoaderResult<TState>;

const createReader = <TState>(key: string, get: SelectorSource<TState>) => (
	store: PicoStore
): PicoValue<TState> => {
	if (store.treeState[key]) {
		return store.treeState[key] as PicoValue<TState>;
	}

	const loader: SelectorLoader<TState> = () => {
		const dependencies = new Set<PicoValue<unknown>>();
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

		// const promises: Promise<unknown>[] = [];
		// dependencies.forEach((picoValue) => {
		// 	picoValue.result.promise && promises.push(picoValue.result.promise);
		// });

		return {
			// value: value || Promise.all(promises).then(() => loader().value),
			// value: isPromise(value) ? value.then(() => loader().value): value,
			value,
			dependencies
		};
	};

	const { value, dependencies } = loader();
	const picoValue = store.createPicoValue(
		key,
		'selector',
		value,
		[],
		dependencies,
		loader
	);

	store.treeState[key] = picoValue as PicoValue<unknown>;

	return picoValue;
};

const createWriter = <TState>(set: SelectorWriter<TState>) => (
	store: PicoStore,
	value: ValueUpdater<TState>
) => {
	set(
		{
			get: <TState>(handler: InternalReadOnlyPicoHandler<TState>) => {
				const result = handler.read(store).result;
				if (isPicoPendingResult(result)) throw result.promise;
				if (isPicoErrorResult(result)) throw result.error;
				return result.value;
			},
			getAsync: <TState>(
				handler: InternalReadOnlyPicoHandler<TState>
			) => {
				const result = handler.read(store).result;
				if (isPicoPendingResult(result)) return result.promise;
				if (isPicoErrorResult(result)) return result.promise;
				return Promise.resolve(result.value);
			},
			set: (handler, value) => handler.save(store, value),
			reset: (handler) => handler.reset(store)
		},
		value
	);
};

const createReset = (reset: SelectorReset) => (store: PicoStore) => {
	reset({
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
		set: (handler, value) => handler.save(store, value),
		reset: (handler) => handler.reset(store)
	});
};

function isReadWriteSelectorConfig<TState>(
	options: ReadOnlySelectorConfig<TState> | ReadWriteSelectorConfig<TState>
): options is ReadWriteSelectorConfig<TState> {
	return (options as ReadWriteSelectorConfig<TState>).set !== undefined;
}

export function selector<TState>(
	options: ReadWriteSelectorConfig<TState>
): InternalReadWritePicoHandler<TState>;
export function selector<TState>(
	options: ReadOnlySelectorConfig<TState>
): InternalReadOnlyPicoHandler<TState>;

export function selector<TState>(
	options: ReadOnlySelectorConfig<TState> | ReadWriteSelectorConfig<TState>
): InternalReadWritePicoHandler<TState> | InternalReadOnlyPicoHandler<TState> {
	const { key, get } = options;

	if (isReadWriteSelectorConfig(options)) {
		const { set, reset } = options;
		return {
			read: createReader(key, get),
			save: createWriter(set),
			reset: createReset(reset)
		};
	}

	return {
		read: createReader(key, get)
	};
}

function isReadWriteSelectorFamilyConfig<TState, TKey>(
	options:
		| ReadOnlySelectorFamilyConfig<TState, TKey>
		| ReadWriteSelectorFamilyConfig<TState, TKey>
): options is ReadWriteSelectorFamilyConfig<TState, TKey> {
	return (
		(options as ReadWriteSelectorFamilyConfig<TState, TKey>).set !==
		undefined
	);
}

export function selectorFamily<TState, TKey>(
	options: ReadWriteSelectorFamilyConfig<TState, TKey>
): (key: TKey) => InternalReadWritePicoHandler<TState>;
export function selectorFamily<TState, TKey>(
	options: ReadOnlySelectorFamilyConfig<TState, TKey>
): (key: TKey) => InternalReadOnlyPicoHandler<TState>;

export function selectorFamily<TState, TKey>(
	options:
		| ReadWriteSelectorFamilyConfig<TState, TKey>
		| ReadOnlySelectorFamilyConfig<TState, TKey>
): (
	id: TKey
) =>
	| InternalReadOnlyPicoHandler<TState>
	| InternalReadWritePicoHandler<TState> {
	const { key, get } = options;
	if (isReadWriteSelectorFamilyConfig(options)) {
		const { set, reset } = options;
		return (id: TKey) =>
			selector<TState>({
				key: `${key}::${id}`,
				get: get(id),
				set: set(id),
				reset: reset(id)
			});
	}
	return (id: TKey) =>
		selector({
			key: `${key}::${id}`,
			get: get(id)
		});
}
