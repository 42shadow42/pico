import { ObservableSet } from '../observable-set';
import { PicoValue } from '../value';

export interface SelectorLoaderResult<TState> {
	value: TState | Promise<TState>;
	dependencies: ObservableSet<PicoValue<unknown>>;
}
export type SelectorLoader<TState> = () => SelectorLoaderResult<TState>;
