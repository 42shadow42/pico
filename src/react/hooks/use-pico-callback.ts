import { useContext, useMemo } from 'react';
import { PicoWriterProps } from '../../core/handler';
import { InternalPicoContext } from '../provider';

export type PicoCallback<T extends Function> = (props: PicoWriterProps) => T;

export const usePicoCallback = function <TFunction extends Function>(
	callback: PicoCallback<TFunction>
): TFunction {
	const store = useContext(InternalPicoContext);
	const props = useMemo<PicoWriterProps>(() => store.getPicoWriterProps(), [
		store
	]);
	return useMemo(() => callback(props), [props]);
};
