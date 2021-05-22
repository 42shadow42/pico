import {
	InternalReadOnlyPicoHandler,
	InternalReadWritePicoHandler
} from '../handler';

export type FamilyHandler<TState> = ((
	id: string
) => InternalReadWritePicoHandler<TState>) & {
	iterator: InternalReadOnlyPicoHandler<TState[]>;
	ids: InternalReadWritePicoHandler<string[]>;
};
