import { DefaultValue, PicoEffect } from '../value';

export interface AtomConfig<TState> {
	key: string;
	default: DefaultValue<TState>;
	effects?: PicoEffect<TState>[];
}
