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

			expect(actual.result.value).toBe(expected);
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

			expect(actual.result.value).toBe(expected);
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
					get: ({ getAsync }) => {
						return getAsync(
							atom({
								key: 'inner-handler',
								default: promiseHandler.promise
							})
						);
					}
				})
			});

			const actual = handler.read(store);

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(defaultValue);
			await actual.result.promise;

			expect(actual.result.promise?.status).toBe('resolved');
			expect(actual.result.value).toBe(expected);
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
					get: ({ getAsync }) => {
						return getAsync(
							atom({
								key: 'inner-handler',
								default: promiseHandler.promise
							})
						);
					}
				})
			});

			const actual = handler.read(store);

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toStrictEqual(promiseHandler.promise);
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.rejecter(error);
			try {
				await actual.result.promise;
			} catch {}

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.error).toBe(expected);
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

			let handler = selector({
				key,
				get: ({ get }) => get(atomHandler),
				set: ({ get, set }) => set(atomHandler, get(copied)),
				reset: ({ reset }) => reset(atomHandler)
			});

			handler.save(store, 'ignored');
			const actualSelector = handler.read(store);

			expect(actualSelector.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actualSelector);

			const actualAtom = handler.read(store);

			expect(actualAtom.result.value).toBe(expected);
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
				get: ({ getAsync }) => getAsync(atomHandler),
				set: ({ getAsync, set }) =>
					set<string>(atomHandler, getAsync(copied)),
				reset: ({ reset }) => reset(atomHandler)
			});

			handler.save(store, 'ignored');
			const actualSelector = handler.read(store);

			expect(actualSelector.result.value).toBeUndefined();
			expect(actualSelector.result.promise).toBeDefined();
			expect(actualSelector.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actualSelector);

			await actualSelector.result.promise;

			expect(actualSelector.result.value).toBe(expected);
			expect(actualSelector.result.promise?.status).toBe('resolved');

			const actualAtom = handler.read(store);

			expect(actualAtom.result.value).toBe(expected);
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
				get: ({ getAsync }) => getAsync(atomHandler),
				set: ({ getAsync, set }) =>
					set<string>(atomHandler, getAsync(copied)),
				reset: ({ reset }) => reset(atomHandler)
			});

			handler.save(store, 'ignored');
			const actualSelector = handler.read(store);

			expect(actualSelector.result.value).toBeUndefined();
			expect(actualSelector.result.promise).toBeDefined();
			expect(actualSelector.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actualSelector);

			promiseHandler.resolver(value);
			await actualSelector.result.promise;

			expect(actualSelector.result.value).toBe(expected);
			expect(actualSelector.result.promise?.status).toBe('resolved');

			const actualAtom = handler.read(store);

			expect(actualAtom.result.value).toBe(expected);
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

			let handler = selector({
				key,
				get: ({ get }) => get(atomHandler),
				set: ({ reset }) => reset(atomHandler),
				reset: ({ reset }) => reset(atomHandler)
			});

			atomHandler.save(store, value);
			handler.save(store, 'ignored');

			const actualSelector = handler.read(store);

			expect(actualSelector.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actualSelector);

			const actualAtom = handler.read(store);

			expect(actualAtom.result.value).toBe(expected);
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

			let handler = selector({
				key,
				get: ({ get }) => get(atomHandler),
				set: () => {},
				reset: ({ set, get }) => set(atomHandler, get(copied))
			});

			handler.reset(store);
			const actualSelector = handler.read(store);

			expect(actualSelector.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actualSelector);

			const actualAtom = handler.read(store);

			expect(actualAtom.result.value).toBe(expected);
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

			let handler = selector({
				key,
				get: ({ getAsync }) => getAsync(atomHandler),
				set: () => {},
				reset: ({ getAsync, set }) => set(atomHandler, getAsync(copied))
			});

			handler.reset(store);
			const actualSelector = handler.read(store);

			expect(actualSelector.result.value).toBeUndefined();
			expect(actualSelector.result.promise).toBeDefined();
			expect(actualSelector.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actualSelector);

			await actualSelector.result.promise;

			expect(actualSelector.result.value).toBe(expected);
			expect(actualSelector.result.promise?.status).toBe('resolved');

			const actualAtom = handler.read(store);

			expect(actualAtom.result.value).toBe(expected);
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

			let handler = selector({
				key,
				get: ({ getAsync }) => getAsync(atomHandler),
				set: () => {},
				reset: ({ getAsync, set }) => set(atomHandler, getAsync(copied))
			});

			handler.reset(store);
			const actualSelector = handler.read(store);

			expect(actualSelector.result.value).toBeUndefined();
			expect(actualSelector.result.promise).toBeDefined();
			expect(actualSelector.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actualSelector);

			promiseHandler.resolver(value);
			await actualSelector.result.promise;

			expect(actualSelector.result.value).toBe(expected);
			expect(actualSelector.result.promise?.status).toBe('resolved');

			const actualAtom = handler.read(store);

			expect(actualAtom.result.value).toBe(expected);
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

			let handler = selector({
				key,
				get: ({ get }) => get(atomHandler),
				set: ({ reset }) => reset(atomHandler),
				reset: ({ reset }) => reset(atomHandler)
			});

			atomHandler.save(store, value);
			handler.save(store, 'ignored');

			const actualSelector = handler.read(store);

			expect(actualSelector.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actualSelector);

			const actualAtom = handler.read(store);

			expect(actualAtom.result.value).toBe(expected);
		});
	});

	describe('track', () => {
		it('should track post promise synchronous values', async () => {
			let store = new PicoStore();

			const key = 'outer-handler';
			const value = 'basic-default';
			const updatedValue = 'updated-value';
			const expected = updatedValue;

			const innerHandler = atom({
				key: 'inner-handler',
				default: value
			});

			let handler = selector({
				key: 'outer-handler',
				get: ({ get }) => {
					return Promise.resolve().then(() => {
						return get(innerHandler);
					});
				}
			});

			const actual = handler.read(store);

			await actual.result.promise;

			expect(actual.result.value).toBe(value);
			expect(store.treeState[key]).toBe(actual);

			innerHandler.save(store, updatedValue);

			await actual.result.promise;

			expect(actual.result.value).toBe(expected);
		});

		it('should track post promise synchronous values asynchronously', async () => {
			let store = new PicoStore();

			const key = 'outer-handler';
			const value = 'basic-default';
			const updatedValue = 'updated-value';
			const expected = updatedValue;

			const innerHandler = atom({
				key: 'inner-handler',
				default: value
			});

			let handler = selector({
				key: 'outer-handler',
				get: ({ getAsync }) => {
					return Promise.resolve().then(() => {
						return getAsync(innerHandler);
					});
				}
			});

			const actual = handler.read(store);

			await actual.result.promise;

			expect(actual.result.value).toBe(value);
			expect(store.treeState[key]).toBe(actual);

			innerHandler.save(store, updatedValue);

			await actual.result.promise;

			expect(actual.result.value).toBe(expected);
		});

		it('should track post promise asynchronous values asynchronously', async () => {
			let store = new PicoStore();
			const promiseHandler = createPromise<string, void>();

			const key = 'outer-handler';
			const value = 'basic-default';
			const updatedValue = 'updated-value';
			const expected = updatedValue;

			const innerHandler = atom({
				key: 'inner-handler',
				default: value
			});

			let handler = selector({
				key: 'outer-handler',
				get: ({ getAsync }) => {
					return Promise.resolve().then(() => {
						return getAsync(innerHandler);
					});
				}
			});

			const actual = handler.read(store);

			await actual.result.promise;

			expect(actual.result.value).toBe(value);
			expect(store.treeState[key]).toBe(actual);

			innerHandler.save(store, promiseHandler.promise);

			promiseHandler.resolver(updatedValue);

			await actual.result.promise;

			expect(actual.result.value).toBe(expected);
		});
	});
});
