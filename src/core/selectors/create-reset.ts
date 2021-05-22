import { PicoStore } from '../store';
import { SelectorReset } from './config';

export const createReset = (reset: SelectorReset) => (store: PicoStore) => {
	reset(store.getPicoWriterProps());
};
