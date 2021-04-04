import { createContext, ReactNode } from 'react';
import { PicoStore } from './store';

export const InternalPicoContext = createContext<PicoStore>(new PicoStore());

export interface PicoProviderProps {
	children: ReactNode;
	store: PicoStore;
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
