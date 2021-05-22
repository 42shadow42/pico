import {
	InternalReadOnlyPicoHandler,
	InternalReadWritePicoHandler
} from '../handler';
import { selector } from '../selectors';
import {
	isReadWriteSelectorFamilyConfig,
	ReadOnlySelectorFamilyConfig,
	ReadWriteSelectorFamilyConfig
} from './config';

export function selectorFamily<TState>(
	options: ReadWriteSelectorFamilyConfig<TState>
): (id: string) => InternalReadWritePicoHandler<TState>;
export function selectorFamily<TState>(
	options: ReadOnlySelectorFamilyConfig<TState>
): (id: string) => InternalReadOnlyPicoHandler<TState>;

export function selectorFamily<TState>(
	options:
		| ReadWriteSelectorFamilyConfig<TState>
		| ReadOnlySelectorFamilyConfig<TState>
) {
	const { key, get } = options;

	if (isReadWriteSelectorFamilyConfig(options)) {
		const { set, reset } = options;
		return (id: string) =>
			selector({
				key: `${key}::${id}`,
				get: get(id),
				set: set(id),
				reset: reset(id)
			});
	}
	return (id: string) =>
		selector({
			key: `${key}::${id}`,
			get: get(id)
		});
}
