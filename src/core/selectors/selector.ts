import {
	InternalReadOnlyPicoHandler,
	InternalReadWritePicoHandler
} from '../handler';
import {
	isReadWriteSelectorConfig,
	ReadOnlySelectorConfig,
	ReadWriteSelectorConfig
} from './config';
import { createDelete } from './create-delete';
import { createReader } from './create-reader';
import { createReset } from './create-reset';
import { createWriter } from './create-writer';

export function selector<TState>(
	options: ReadWriteSelectorConfig<TState>
): InternalReadWritePicoHandler<TState>;
export function selector<TState>(
	options: ReadOnlySelectorConfig<TState>
): InternalReadOnlyPicoHandler<TState>;

export function selector<TState>(
	options: ReadOnlySelectorConfig<TState> | ReadWriteSelectorConfig<TState>
): InternalReadWritePicoHandler<TState> | InternalReadOnlyPicoHandler<TState> {
	const { key, get } = options;

	if (isReadWriteSelectorConfig(options)) {
		const { set, reset } = options;
		return {
			read: createReader(key, get),
			save: createWriter(set),
			reset: createReset(reset),
			delete: createDelete(key)
		};
	}

	return {
		read: createReader(key, get),
		delete: createDelete(key)
	};
}
