import { PicoWriterProps } from '../handler';
import { PicoValue } from './pico-value';

export type ValueEvent<TState> = PicoWriterProps & {
	key: string;
	value: PicoValue<TState>;
};

export type ValueUpdatingHandler<TState> = (
	picoValue: PicoValue<TState>
) => void;
export type ValueUpdatedHandler<TState> = (
	picoValue: PicoValue<TState>
) => void;

export interface PicoValueSubscriber<TState> {
	onUpdating?: ValueUpdatingHandler<TState>;
	onUpdated?: ValueUpdatedHandler<TState>;
}
