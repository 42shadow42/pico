import { createContext, ReactNode } from 'react';
import { PicoStore } from './store';

export const InternalPicoContext = createContext<PicoStore>(new PicoStore());

export interface RecoilProviderProps {
	children: ReactNode;
	tree: PicoStore;
}

export const RecoilProvider = function RecoilProvider({
	children,
	tree
}: RecoilProviderProps): JSX.Element {
	return (
		<InternalPicoContext.Provider value={tree}>
			{children}
		</InternalPicoContext.Provider>
	);
};
