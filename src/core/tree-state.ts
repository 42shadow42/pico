import { PicoValue } from './value';

export interface InternalTreeState {
	[key: string]: PicoValue<unknown>;
}
