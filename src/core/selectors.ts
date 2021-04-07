import isPromise from 'is-promise';
import { atom } from './atoms';
import {
	InternalReadOnlyPicoHandler,
	InternalReadWritePicoHandler
} from './handler';
import {
	FamilyHandler,
	PicoGetterProps,
	PicoWriterProps,
	ValueUpdater
} from './shared';
import { PicoStore } from './store';
import {
	isPicoErrorResult,
	isPicoPendingResult,
	PicoEffect,
	PicoValue
} from './value';

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
	effects?: PicoEffect<TState>[];
}

export type ReadWriteSelectorConfig<TState> = ReadOnlySelectorConfig<TState> & {
	set: SelectorWriter<TState>;
	reset: SelectorReset;
};

export interface ReadOnlySelectorFamilyConfig<TState> {
	key: string;
	get: (key: string) => SelectorSource<TState>;
	effects?: PicoEffect<TState>[];
}

export type ReadWriteSelectorFamilyConfig<
	TState
> = ReadOnlySelectorFamilyConfig<TState> & {
	set: (key: string) => SelectorWriter<TState>;
	reset: (key: string) => SelectorReset;
};

export interface SelectorLoaderResult<TState> {
	value: TState | Promise<TState>;
	dependencies: Set<PicoValue<unknown>>;
}
export type SelectorLoader<TState> = () => SelectorLoaderResult<TState>;

const createReader = <TState>(key: string, get: SelectorSource<TState>) => (
	store: PicoStore
): PicoValue<TState> => {
	let picoValue = store.resolve<TState>(key);
	if (picoValue) {
		return picoValue;
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

function isReadWriteSelectorFamilyConfig<TState>(
	options:
		| ReadOnlySelectorFamilyConfig<TState>
		| ReadWriteSelectorFamilyConfig<TState>
): options is ReadWriteSelectorFamilyConfig<TState> {
	return (options as ReadWriteSelectorFamilyConfig<TState>).set !== undefined;
}

export function selectorFamily<TState>(
	options: ReadWriteSelectorFamilyConfig<TState>
): ((key: string) => InternalReadWritePicoHandler<TState>) &
	FamilyHandler<TState>;
export function selectorFamily<TState>(
	options: ReadOnlySelectorFamilyConfig<TState>
): ((key: string) => InternalReadOnlyPicoHandler<TState>) &
	FamilyHandler<TState>;

export function selectorFamily<TState>(
	options:
		| ReadWriteSelectorFamilyConfig<TState>
		| ReadOnlySelectorFamilyConfig<TState>
) {
	const { key, get, effects = [] } = options;

	const ids = atom<string[]>({ key: `${key}:keys`, default: [] });
	const tracker: PicoEffect<TState> = {
		onCreated: ({ key, get, set }) => {
			const createdId = key.split('::')[1];
			set(ids, [...get(ids), createdId]);
		},
		onDeleting: ({ key, get, set }) => {
			const deletedId = key.split('::')[1];
			set(
				ids,
				get(ids).filter((id) => deletedId !== id)
			);
		}
	};
	const effectsWithTracker = [...effects, tracker];

	if (isReadWriteSelectorFamilyConfig(options)) {
		const { set, reset } = options;
		const accessor = (id: string) =>
			selector({
				key: `${key}::${id}`,
				get: get(id),
				set: set(id),
				reset: reset(id),
				effects: effectsWithTracker
			});
		const iterator = selector({
			key: `${key}:iter`,
			get: ({ get }) => {
				return [...get(ids)].map((id) => get(accessor(id)));
			}
		});
		accessor.ids = ids;
		accessor.iterator = iterator;
		return accessor;
	}
	const accessor = (id: string) =>
		selector({
			key: `${key}::${id}`,
			get: get(id),
			effects: effectsWithTracker
		});
	const iterator = selector({
		key: `${key}:iter`,
		get: ({ get }) => {
			return [...get(ids)].map((id) => get(accessor(id)));
		}
	});
	accessor.ids = ids;
	accessor.iterator = iterator;
	return accessor;
}
