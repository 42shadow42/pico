import { atom, AtomConfig } from './atoms';
import {
	InternalReadWritePicoHandler,
	InternalReadOnlyPicoHandler
} from './handler';
import {
	selector,
	SelectorReset,
	SelectorSource,
	SelectorWriter
} from './selectors';
import { PicoEffect } from './value';

export type FamilyHandler<TState> = ((
	id: string
) => InternalReadWritePicoHandler<TState>) & {
	iterator: InternalReadOnlyPicoHandler<TState[]>;
	ids: InternalReadWritePicoHandler<string[]>;
};

export function atomFamily<TState>({
	key,
	default: defaultValue,
	effects = []
}: AtomConfig<TState>): FamilyHandler<TState> {
	const ids = atom<string[]>({ key: `${key}:keys`, default: [] });
	const tracker: PicoEffect<TState> = {
		onCreated: ({ key, get, set }) => {
			const createdId = key.split('::')[1];
			setTimeout(() => set(ids, [...get(ids), createdId]), 0);
		},
		onDeleting: ({ key, get, set }) => {
			const deletedId = key.split('::')[1];
			setTimeout(
				() =>
					set(
						ids,
						get(ids).filter((id) => deletedId !== id)
					),
				0
			);
		}
	};
	const iterator = selector({
		key: `${key}:iter`,
		get: ({ get }) => {
			return [...get(ids)].map((id) => get(accessor(id)));
		}
	});
	const effectsWithTracker = [...effects, tracker];
	const accessor = (id: string) =>
		atom({
			key: `${key}::${id}`,
			default: defaultValue,
			effects: effectsWithTracker
		});
	accessor.ids = ids;
	accessor.iterator = iterator;
	return accessor;
}

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

function isReadWriteSelectorFamilyConfig<TState>(
	options:
		| ReadOnlySelectorFamilyConfig<TState>
		| ReadWriteSelectorFamilyConfig<TState>
): options is ReadWriteSelectorFamilyConfig<TState> {
	return (options as ReadWriteSelectorFamilyConfig<TState>).set !== undefined;
}

export function selectorFamily<TState>(
	options: ReadWriteSelectorFamilyConfig<TState>
): FamilyHandler<TState>;
export function selectorFamily<TState>(
	options: ReadOnlySelectorFamilyConfig<TState>
): FamilyHandler<TState>;

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
