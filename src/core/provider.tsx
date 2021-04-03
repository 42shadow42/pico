import { createContext, ReactNode } from 'react';
import { PicoStore } from './store';

export const InternalPicoContext = createContext<PicoStore>(new PicoStore());

export interface PicoProviderProps {
	children: ReactNode;
	tree: PicoStore;
}

export const PicoProvider = function PicoProvider({
	children,
	tree
}: PicoProviderProps): JSX.Element {
	return (
		<InternalPicoContext.Provider value={tree}>
			{children}
		</InternalPicoContext.Provider>
	);
};
