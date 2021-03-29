import { atom } from '../src/core/atoms';
import { selector } from '../src/core/selectors';
import { PicoStore } from '../src/core/store';
import { createPromise } from '../test-utils/promise';

describe('selector-advanced', () => {
	describe('read', () => {
		it('should apply basic selector handler defaults', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: selector({
					key: 'middle-handler',
					get: ({ get }) => {
						return get(
							atom({
								key: 'inner-handler',
								default: defaultValue
							})
						);
					}
				})
			});

			const actual = handler.read(store);

			expect(actual.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should apply selector function handler defaults', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: selector({
					key: 'middle-handler',
					get: ({ get }) => {
						return get(
							atom({
								key: 'inner-handler',
								default: () => defaultValue
							})
						);
					}
				})
			});

			const actual = handler.read(store);

			expect(actual.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should apply selector promise handler defaults', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<string, void>();

			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: selector({
					key: 'middle-handler',
					get: ({ get }) => {
						return get(
							atom({
								key: 'inner-handler',
								default: promiseHandler.promise
							})
						);
					}
				})
			});

			const actual = handler.read(store);

			expect(actual.value).toBeUndefined();
			expect(actual.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(defaultValue);
			await actual.promise;

			expect(actual.promise?.status).toBe('resolved');
			expect(actual.value).toBe(expected);
		});

		it('should apply selector promise handler errors', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<void, string>();

			const key = 'outer-handler';
			const error = 'basic-default';
			const expected = error;

			let handler = atom({
				key,
				default: selector({
					key: 'middle-handler',
					get: ({ get }) => {
						return get(
							atom({
								key: 'inner-handler',
								default: promiseHandler.promise
							})
						);
					}
				})
			});

			const actual = handler.read(store);

			expect(actual.value).toBeUndefined();
			expect(actual.promise).toStrictEqual(promiseHandler.promise);
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.rejecter(error);
			try {
				await actual.promise;
			} catch {}

			await Promise.resolve();
			await Promise.resolve();

			expect(actual.value).toBeUndefined();
			expect(actual.error).toBe(expected);
		});
	});

	describe('write', () => {
		it('should allow reading synchronous values on write', () => {
			let store = new PicoStore();
			const key = 'selector';
			const defaultValue = 'basic-default';
			const value = 'basic-value';
			const expected = value;

			const atomHandler = atom({
				key: 'atom',
				default: defaultValue
			});

			const copied = atom({
				key: 'copied',
				default: value
			});

			let handler = selector<string>({
				key,
				get: ({ get }) => get<string>(atomHandler) as string,
				set: ({ get, set }) =>
					set<string>(atomHandler, get(copied) as string),
				reset: ({ reset }) => reset(atomHandler)
			});

			handler.save(store, 'ignored');
			const actualSelector = handler.read(store);

			expect(actualSelector.value).toBe(expected);
			expect(store.treeState[key]).toBe(actualSelector);

			const actualAtom = handler.read(store);

			expect(actualAtom.value).toBe(expected);
		});

		it('should allow reading synchronous values asynchronously on write', async () => {
			let store = new PicoStore();
			const key = 'selector';
			const defaultValue = 'basic-default';
			const value = 'basic-value';
			const expected = value;

			const atomHandler = atom({
				key: 'atom',
				default: defaultValue
			});

			const copied = atom({
				key: 'copied',
				default: value
			});

			let handler = selector<string>({
				key,
				get: ({ get }) => get<string>(atomHandler) as string,
				set: ({ getAsync, set }) =>
					set<string>(
						atomHandler,
						getAsync(copied) as Promise<string>
					),
				reset: ({ reset }) => reset(atomHandler)
			});

			handler.save(store, 'ignored');
			const actualSelector = handler.read(store);

			expect(actualSelector.value).toBeUndefined();
			expect(actualSelector.promise).toBeDefined();
			expect(actualSelector.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actualSelector);

			await actualSelector.promise;

			expect(actualSelector.value).toBe(expected);
			expect(actualSelector.promise?.status).toBe('resolved');

			const actualAtom = handler.read(store);

			expect(actualAtom.value).toBe(expected);
		});

		it('should allow reading asynchronous values on write', async () => {
			let store = new PicoStore();
			const promiseHandler = createPromise<string, void>();

			const key = 'selector';
			const defaultValue = 'basic-default';
			const value = 'basic-value';
			const expected = value;

			const atomHandler = atom({
				key: 'atom',
				default: defaultValue
			});

			const copied = atom({
				key: 'copied',
				default: promiseHandler.promise
			});

			let handler = selector<string>({
				key,
				get: ({ get }) => get<string>(atomHandler) as string,
				set: ({ getAsync, set }) =>
					set<string>(
						atomHandler,
						getAsync(copied) as Promise<string>
					),
				reset: ({ reset }) => reset(atomHandler)
			});

			handler.save(store, 'ignored');
			const actualSelector = handler.read(store);

			expect(actualSelector.value).toBeUndefined();
			expect(actualSelector.promise).toBeDefined();
			expect(actualSelector.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actualSelector);

			promiseHandler.resolver(value);
			await actualSelector.promise;

			expect(actualSelector.value).toBe(expected);
			expect(actualSelector.promise?.status).toBe('resolved');

			const actualAtom = handler.read(store);

			expect(actualAtom.value).toBe(expected);
		});

		it('should allow reseting values on write', () => {
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
				get: ({ get }) => get<string>(atomHandler) as string,
				set: ({ reset }) => reset<string>(atomHandler),
				reset: ({ reset }) => reset(atomHandler)
			});

			atomHandler.save(store, value);
			handler.save(store, 'ignored');

			const actualSelector = handler.read(store);

			expect(actualSelector.value).toBe(expected);
			expect(store.treeState[key]).toBe(actualSelector);

			const actualAtom = handler.read(store);

			expect(actualAtom.value).toBe(expected);
		});
	});

	describe('reset', () => {
		it('should allow reading synchronous values on reset', () => {
			let store = new PicoStore();
			const key = 'selector';
			const defaultValue = 'basic-default';
			const value = 'basic-value';
			const expected = value;

			const atomHandler = atom({
				key: 'atom',
				default: defaultValue
			});

			const copied = atom({
				key: 'copied',
				default: value
			});

			let handler = selector<string>({
				key,
				get: ({ get }) => get<string>(atomHandler) as string,
				set: () => {},
				reset: ({ set, get }) =>
					set<string>(atomHandler, get(copied) as string)
			});

			handler.reset(store);
			const actualSelector = handler.read(store);

			expect(actualSelector.value).toBe(expected);
			expect(store.treeState[key]).toBe(actualSelector);

			const actualAtom = handler.read(store);

			expect(actualAtom.value).toBe(expected);
		});

		it('should allow reading synchronous values asynchronously on write', async () => {
			let store = new PicoStore();
			const key = 'selector';
			const defaultValue = 'basic-default';
			const value = 'basic-value';
			const expected = value;

			const atomHandler = atom({
				key: 'atom',
				default: defaultValue
			});

			const copied = atom({
				key: 'copied',
				default: value
			});

			let handler = selector<string>({
				key,
				get: ({ get }) => get<string>(atomHandler) as string,
				set: () => {},
				reset: ({ getAsync, set }) =>
					set<string>(
						atomHandler,
						getAsync(copied) as Promise<string>
					)
			});

			handler.reset(store);
			const actualSelector = handler.read(store);

			expect(actualSelector.value).toBeUndefined();
			expect(actualSelector.promise).toBeDefined();
			expect(actualSelector.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actualSelector);

			await actualSelector.promise;

			expect(actualSelector.value).toBe(expected);
			expect(actualSelector.promise?.status).toBe('resolved');

			const actualAtom = handler.read(store);

			expect(actualAtom.value).toBe(expected);
		});

		it('should allow reading asynchronous values on write', async () => {
			let store = new PicoStore();
			const promiseHandler = createPromise<string, void>();

			const key = 'selector';
			const defaultValue = 'basic-default';
			const value = 'basic-value';
			const expected = value;

			const atomHandler = atom({
				key: 'atom',
				default: defaultValue
			});

			const copied = atom({
				key: 'copied',
				default: promiseHandler.promise
			});

			let handler = selector<string>({
				key,
				get: ({ get }) => get<string>(atomHandler) as string,
				set: () => {},
				reset: ({ getAsync, set }) =>
					set<string>(
						atomHandler,
						getAsync(copied) as Promise<string>
					)
			});

			handler.reset(store);
			const actualSelector = handler.read(store);

			expect(actualSelector.value).toBeUndefined();
			expect(actualSelector.promise).toBeDefined();
			expect(actualSelector.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actualSelector);

			promiseHandler.resolver(value);
			await actualSelector.promise;

			expect(actualSelector.value).toBe(expected);
			expect(actualSelector.promise?.status).toBe('resolved');

			const actualAtom = handler.read(store);

			expect(actualAtom.value).toBe(expected);
		});

		it('should allow reseting values on write', () => {
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
				get: ({ get }) => get<string>(atomHandler) as string,
				set: ({ reset }) => reset<string>(atomHandler),
				reset: ({ reset }) => reset(atomHandler)
			});

			atomHandler.save(store, value);
			handler.save(store, 'ignored');

			const actualSelector = handler.read(store);

			expect(actualSelector.value).toBe(expected);
			expect(store.treeState[key]).toBe(actualSelector);

			const actualAtom = handler.read(store);

			expect(actualAtom.value).toBe(expected);
		});
	});
});
