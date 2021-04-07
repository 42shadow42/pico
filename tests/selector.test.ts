import { atom } from '../src/core/atoms';
import { selector } from '../src/core/selectors';
import { PicoStore } from '../src/core/store';
import { createPromise } from '../test-utils/promise';

describe('selector', () => {
	it('should utilize existing value', () => {
		let store = new PicoStore();

		let handler = selector({
			key: 'selector',
			get: () => 'default'
		});

		const initial = handler.read(store);
		const other = handler.read(store);

		expect(other).toBe(initial);
	});

	describe('read', () => {
		it('should allow getting synchronous atoms', () => {
			let store = new PicoStore();
			const key = 'selector';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = selector({
				key,
				get: ({ get }) => {
					return get(
						atom({
							key: 'atom',
							default: defaultValue
						})
					);
				}
			});

			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should allow getting synchronous atoms as promises', async () => {
			let store = new PicoStore();

			const key = 'selector';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = selector({
				key,
				get: ({ getAsync }) => {
					return getAsync(
						atom({
							key: 'atom',
							default: defaultValue
						})
					);
				}
			});

			const actual = handler.read(store);

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toBeDefined();
			expect(actual.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			await actual.result.promise;

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should allow getting asynchronous atoms as promises', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<string, void>();

			const key = 'selector';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = selector({
				key,
				get: ({ getAsync }) => {
					return getAsync(
						atom({
							key: 'atom',
							default: promiseHandler.promise
						})
					);
				}
			});

			const actual = handler.read(store);

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(defaultValue);
			await actual.result.promise;

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});
	});

	describe('track', () => {
		it('should track changes to atoms', () => {
			let store = new PicoStore();
			const key = 'selector';
			const defaultValue = 'basic-default';
			const value = 'basic-value';
			const expected = value;

			let atomHandler = atom({
				key: 'atom',
				default: defaultValue
			});

			let handler = selector({
				key,
				get: ({ get }) => get(atomHandler)
			});

			const initial = handler.read(store);
			atomHandler.save(store, value);

			expect(initial.result.value).toBe(expected);
		});

		it('should track changes to selectors', () => {
			let store = new PicoStore();
			const key = 'selector';
			const defaultValue = 'basic-default';
			const value = 'basic-value';
			const expected = value;

			const atomHandler = atom({
				key: 'atom',
				default: defaultValue
			});

			let handler = selector({
				key,
				get: ({ get }) =>
					get(
						selector({
							key: 'intermediate',
							get: ({ get }) => get(atomHandler)
						})
					)
			});

			const initial = handler.read(store);
			atomHandler.save(store, value);

			expect(initial.result.value).toBe(expected);
		});
	});

	describe('write', () => {
		it('should write', () => {
			let store = new PicoStore();
			const key = 'selector';
			const defaultValue = 'basic-default';
			const value = 'basic-value';
			const expected = value;

			const atomHandler = atom({
				key: 'atom',
				default: defaultValue
			});

			let handler = selector<string>({
				key,
				get: ({ get }) => get(atomHandler),
				set: ({ set }, value) => set<string>(atomHandler, value),
				reset: ({ reset }) => reset(atomHandler)
			});

			handler.save(store, value);
			const actualSelector = handler.read(store);

			expect(actualSelector.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actualSelector);

			const actualAtom = handler.read(store);

			expect(actualAtom.result.value).toBe(expected);
		});
	});

	describe('reset', () => {
		it('should reset', () => {
			let store = new PicoStore();
			const key = 'selector';
			const defaultValue = 'basic-default';
			const value = 'basic-value';
			const expected = defaultValue;

			const atomHandler = atom({
				key: 'atom',
				default: defaultValue
			});

			let handler = selector<string>({
				key,
				get: ({ get }) => get(atomHandler),
				set: ({ set }, value) => set<string>(atomHandler, value),
				reset: ({ reset }) => reset(atomHandler)
			});

			handler.save(store, value);
			handler.reset(store);
			const actualSelector = handler.read(store);

			expect(actualSelector.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actualSelector);

			const actualAtom = handler.read(store);

			expect(actualAtom.result.value).toBe(expected);
		});
	});
});
