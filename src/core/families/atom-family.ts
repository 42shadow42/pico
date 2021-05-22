import { atom, AtomConfig } from '../atoms';
import { selector } from '../selectors';
import { PicoEffect } from '../value';
import { FamilyHandler } from './family-handler';

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
