import {
	InternalReadOnlyPicoHandler,
	InternalReadWritePicoHandler
} from './handler';
import { PicoStore } from './store';
import { PicoValue, PicoValueSubscriber } from './value';

export type SetPicoState = <TState>(
	handler: InternalReadWritePicoHandler<TState>,
	value: TState
) => void;
export type ResetPicoState = <TState>(
	handler: InternalReadWritePicoHandler<TState>
) => void;
export type GetPicoState = <TState>(
	handler: InternalReadOnlyPicoHandler<TState>
) => TState | undefined;
export type GetAsyncPicoState = <TState>(
	handler: InternalReadOnlyPicoHandler<TState>
) => Promise<TState | undefined>;

export interface SelectorGetterProps {
	get: GetPicoState;
	getAsync: GetAsyncPicoState;
}
export type SelectorWriterProps = SelectorGetterProps & {
	set: SetPicoState;
	reset: ResetPicoState;
};

export type SelectorSource<TState> = (
	props: SelectorGetterProps
) => TState | Promise<TState>;
export type SelectorWriter<TState> = (
	props: SelectorWriterProps,
	value: TState
) => void;
export type SelectorReset = (props: SelectorWriterProps) => void;

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

const createReader = <TState>(key: string, get: SelectorSource<TState>) => (
	store: PicoStore
): PicoValue<TState> => {
	if (store.treeState[key]) {
		return store.treeState[key] as PicoValue<TState>;
	}

	const loader = () => {
		const dependencies = new Set<PicoValue<unknown>>();

		const value = get({
			get: (handler) => {
				const recoilValue = handler.read(store);
				dependencies.add(recoilValue as PicoValue<unknown>);
				return recoilValue.value;
			},
			getAsync: (handler) => {
				const recoilValue = handler.read(store);
				dependencies.add(recoilValue as PicoValue<unknown>);
				return (
					recoilValue.promise || Promise.resolve(recoilValue.value)
				);
			}
		});

		return {
			value,
			dependencies
		};
	};

	const { value, dependencies } = loader();
	const picoValue = new PicoValue(key, value, dependencies);
	const watcher: PicoValueSubscriber = {
		onUpdated: () => {
			picoValue
				.getDependencies()
				.forEach((dependency) => dependency.unsubscribe(watcher));
			const { value, dependencies } = loader();
			picoValue.updateValue(value, dependencies);
			dependencies.forEach((dependency) => dependency.subscribe(watcher));
		}
	};

	dependencies.forEach((dependency) => {
		dependency.subscribe(watcher);
	});

	store.treeState[key] = picoValue as PicoValue<unknown>;

	return picoValue;
};

const createWriter = <TState>(set: SelectorWriter<TState>) => (
	store: PicoStore,
	value: TState
) => {
	set(
		{
			get: (handler) => handler.read(store).value,
			getAsync: (handler) =>
				handler.read(store).promise ||
				Promise.resolve(handler.read(store).value),
			set: (handler, value) => handler.save(store, value),
			reset: (handler) => handler.reset(store)
		},
		value
	);
};

const createReset = (reset: SelectorReset) => (store: PicoStore) => {
	reset({
		get: (handler) => handler.read(store).value,
		getAsync: (handler) =>
			handler.read(store).promise ||
			Promise.resolve(handler.read(store).value),
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
