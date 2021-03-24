import { InternalPicoHandler } from './atoms';
import { InternalTreeState } from './tree-state';
import { PicoValue, PicoValueSubscription } from './value';

export interface SelectorGetterProps {
	get: (handler: InternalPicoHandler<any>) => unknown;
}

export type SelectorSource<T> = (props: SelectorGetterProps) => T | Promise<T>;

export interface SelectorConfig<T> {
	key: string;
	get: SelectorSource<T>;
}

export interface SelectorFamilyConfig<TState, TKey> {
	key: string;
	get: (key: TKey) => SelectorSource<TState>;
}

export function selector<TState>({
	key,
	get
}: SelectorConfig<TState>): InternalPicoHandler<TState> {
	const saver = (state: InternalTreeState, value: TState): void =>
		console.log('Selector values cannot be set directly');

	return {
		read: (picoState) => {
			if (picoState[key]) {
				return picoState[key] as PicoValue<TState>;
			}

			const loader = () => {
				const dependencies = new Set<PicoValue<unknown>>();

				const value = get({
					get: (handler) => {
						const recoilValue = handler.read(picoState);
						dependencies.add(recoilValue);
						return recoilValue.value;
					}
				});

				return {
					value,
					dependencies
				};
			};

			const { value, dependencies } = loader();
			const picoValue = new PicoValue(value, dependencies);
			const watcher: PicoValueSubscription<unknown> = () => {
				picoValue
					.getDependencies()
					.forEach((dependency) => dependency.unsubscribe(watcher));
				const { value, dependencies } = loader();
				picoValue.updateValue(value, dependencies);
				dependencies.forEach((dependency) =>
					dependency.subscribe(watcher)
				);
			};

			dependencies.forEach((dependency) => {
				dependency.subscribe(watcher);
			});

			picoState[key] = picoValue as PicoValue<unknown>;

			return picoValue;
		},
		save: saver
	};
}

export function selectorFamily<TState, TKey>({
	key,
	get
}: SelectorFamilyConfig<TState, TKey>): (
	id: TKey
) => InternalPicoHandler<TState> {
	return (id: TKey) =>
		selector({
			key: `${key}::${id}`,
			get: get(id)
		});
}
