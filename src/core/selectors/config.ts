import { PicoGetterProps, PicoWriterProps, ValueUpdater } from '../handler';

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

export function isReadWriteSelectorConfig<TState>(
	options: ReadOnlySelectorConfig<TState> | ReadWriteSelectorConfig<TState>
): options is ReadWriteSelectorConfig<TState> {
	return (options as ReadWriteSelectorConfig<TState>).set !== undefined;
}
