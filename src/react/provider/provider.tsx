import React, { ReactNode } from 'react';
import { PicoStore } from '../../core';
import { InternalPicoContext } from './context';

export interface PicoProviderProps {
	children: ReactNode;
	store?: PicoStore;
}

export const PicoProvider = function PicoProvider({
	children,
	store = new PicoStore()
}: PicoProviderProps): JSX.Element {
	return (
		<InternalPicoContext.Provider value={store}>
			{children}
		</InternalPicoContext.Provider>
	);
};
