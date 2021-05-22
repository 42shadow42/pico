import { ValueEvent } from './pico-value-subscriber';

export type PicoEffectHandler<TState> = (props: ValueEvent<TState>) => void;

export interface PicoEffect<TState> {
	onCreated?: PicoEffectHandler<TState>;
	onUpdating?: PicoEffectHandler<TState>;
	onUpdated?: PicoEffectHandler<TState>;
	onDeleting?: PicoEffectHandler<TState>;
}
