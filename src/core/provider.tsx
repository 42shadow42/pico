import { createContext, ReactNode } from 'react';
import { InternalTreeState } from './tree-state';

export const InternalPicoContext = createContext<InternalTreeState>({});

export interface RecoilProviderProps {
	children: ReactNode;
	tree: InternalTreeState;
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
