import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState
} from 'react';
import { InternalPicoContext } from '../react/provider';
import { PicoStoreSubscriber } from '../core';

type Batch = InternalBatchComponent[];
type InternalBatchComponent = () => void;

export class History {
	private history: Batch[] = [];
	private future: Batch[] = [];
	private rerender?: () => void;
	private batch: Batch = [];
	private batchInProgress = false;

	commitHistory = (clearFuture = true): void => {
		if (this.batch.length > 0) {
			this.history.push(this.batch);
			this.batch = [];
			if (clearFuture) {
				this.future = [];
			}
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
		this.commitHistory(false);
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
			onAtomCreated: ({ key }): void => {
				history?.internalAddBatchComponent(() =>
					store.deletePicoValue(key)
				);
			},
			onAtomDeleting: (picoValue): void => {
				history?.internalAddBatchComponent(() =>
					store.createPicoValue(
						picoValue.key,
						'atom',
						picoValue.result.value || picoValue.result.promise,
						picoValue.getEffects(),
						picoValue.getDependencies()
					)
				);
			},
			onAtomUpdating: (picoValue): void => {
				const result = picoValue.result;
				const dependencies = picoValue.getDependencies();
				history?.internalAddBatchComponent(() => {
					picoValue.update(result.value, dependencies);
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
