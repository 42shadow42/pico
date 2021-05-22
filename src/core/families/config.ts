import { SelectorReset, SelectorSource, SelectorWriter } from '../selectors';

export interface ReadOnlySelectorFamilyConfig<TState> {
	key: string;
	get: (key: string) => SelectorSource<TState>;
}

export type ReadWriteSelectorFamilyConfig<
	TState
> = ReadOnlySelectorFamilyConfig<TState> & {
	set: (key: string) => SelectorWriter<TState>;
	reset: (key: string) => SelectorReset;
};

export function isReadWriteSelectorFamilyConfig<TState>(
	options:
		| ReadOnlySelectorFamilyConfig<TState>
		| ReadWriteSelectorFamilyConfig<TState>
): options is ReadWriteSelectorFamilyConfig<TState> {
	return (options as ReadWriteSelectorFamilyConfig<TState>).set !== undefined;
}
