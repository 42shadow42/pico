import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState
} from 'react';
import { InternalPicoContext } from '../core/provider';
import { PicoStoreSubscriber } from '../core/store';
import { PicoValue } from '../core/value';

type Batch = InternalBatchComponent[];
type InternalBatchComponent = () => void;

export class History {
	private history: Batch[] = [];
	private future: Batch[] = [];
	private rerender?: () => void;
	private batch: Batch = [];
	private batchInProgress = false;

	commitHistory = (): void => {
		if (this.batch.length > 0) {
			this.history.push(this.batch);
			this.batch = [];
		}

		this.batchInProgress = false;
	};

	commitFuture = (): void => {
		if (this.batch.length > 0) {
			this.future.push(this.batch);
			this.batch = [];
		}

		this.batchInProgress = false;
	};

	internalAddBatchComponent = (component: InternalBatchComponent): void => {
		this.batch = [component, ...this.batch];
		if (!this.batchInProgress) {
			setTimeout(() => this.rerender && this.rerender());
		}
		this.batchInProgress = false;
	};

	configure = (rerender: () => void): void => {
		this.rerender = rerender;
	};

	back = (): void => {
		this.commitHistory();
		this.history.pop()?.forEach((component) => component());
		this.commitFuture();
	};

	forward = (): void => {
		this.future.pop()?.forEach((component) => component());
		this.commitHistory();
	};
}

export const HistoryContext = createContext<History>(new History());

export interface HistoryObserverProps {
	children: ReactNode;
	manual?: boolean;
}

export const HistoryObserver = ({ children, manual }: HistoryObserverProps) => {
	const store = useContext(InternalPicoContext);
	const [, rerender] = useState({});
	const [history] = useState<History>(new History());

	useEffect(() => {
		const monitor: PicoStoreSubscriber = {
			onAtomCreated: (key: string): void => {
				history?.internalAddBatchComponent(() =>
					store.deletePicoValue(key)
				);
			},
			onAtomDeleting: (key: string): void => {
				const value = store.treeState[key]?.value;
				history?.internalAddBatchComponent(() =>
					store.createPicoValue(key, value)
				);
			},
			onAtomUpdating: (key: string): void => {
				const value = (store.treeState[key] as PicoValue<unknown>)
					.value;
				history?.internalAddBatchComponent(() => {
					const picoValue = store.treeState[
						key
					] as PicoValue<unknown>;
					picoValue.updateValue(value);
				});
			}
		};
		history.configure(() => rerender({}));

		store.subscribe(monitor);

		return () => store.unsubscribe(monitor);
	}, [store, history, rerender]);

	useEffect(() => {
		if (!manual) {
			history?.commitHistory();
		}
	});

	return (
		<HistoryContext.Provider value={history}>
			{history && children}
		</HistoryContext.Provider>
	);
};
