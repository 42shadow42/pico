import { ValueUpdater } from '../handler';
import { PicoStore } from '../store';
import { SelectorWriter } from './config';

export const createWriter = <TState>(set: SelectorWriter<TState>) => (
	store: PicoStore,
	value: ValueUpdater<TState>
) => {
	set(store.getPicoWriterProps(), value);
};
