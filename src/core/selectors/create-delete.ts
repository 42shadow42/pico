import { PicoStore } from '../store';

export const createDelete = (key: string) => (store: PicoStore) =>
	store.deletePicoValue(key);
