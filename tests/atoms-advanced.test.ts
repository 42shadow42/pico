import { PicoStore, atom, PicoEffect } from '../src/core';
import { createPromise } from '../test-utils/promise';

describe('atom-advanced', () => {
	describe('read', () => {
		it('should apply basic atom handler defaults', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: atom({
					key: 'inner-handler',
					default: defaultValue
				})
			});

			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should apply atom function handler defaults', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: atom({
					key: 'inner-handler',
					default: () => defaultValue
				})
			});

			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should apply atom promise handler defaults', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<string, void>();

			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: atom({
					key: 'inner-handler',
					default: promiseHandler.promise
				})
			});

			const actual = handler.read(store);

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(defaultValue);
			await actual.result.promise;

			expect(actual.result.value).toBe(expected);
			expect(actual.result.promise?.status).toBe('resolved');
		});

		it('should apply atom promise handler errors', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<void, string>();

			const key = 'outer-handler';
			const error = 'basic-default';
			const expected = error;

			let handler = atom({
				key,
				default: atom({
					key: 'inner-handler',
					default: promiseHandler.promise
				})
			});

			const actual = handler.read(store);

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.rejecter(error);
			try {
				await actual.result.promise;
			} catch {}

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise?.status).toBe('rejected');
			expect(actual.result.error).toBe(expected);
		});

		it('should apply nested atom handler', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: atom({
					key: 'middle-handler',
					default: atom({
						key: 'inner-handler',
						default: defaultValue
					})
				})
			});

			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});
	});

	describe('write', () => {
		it('should write unresolved handler promise values', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<string, void>();

			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedValue = 'basic-value';
			const expected = savedValue;

			let handler = atom({
				key,
				default: defaultValue
			});

			handler.save(
				store,
				atom({
					key: 'unresolved-handler',
					default: promiseHandler.promise
				})
			);
			const actual = handler.read(store);

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(savedValue);
			await actual.result.promise;

			expect(actual.result.value).toBe(expected);
			expect(actual.result.promise?.status).toBe('resolved');
		});

		it('should reset unresolved handler promise values', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<string, void>();

			const key = 'outer-handler';
			const savedValue = 'basic-value';
			const expected = savedValue;

			let handler = atom({
				key,
				default: atom({
					key: 'unresolved-handler',
					default: promiseHandler.promise
				})
			});

			handler.reset(store);
			const actual = handler.read(store);

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(savedValue);
			await actual.result.promise;

			expect(actual.result.value).toBe(expected);
			expect(actual.result.promise?.status).toBe('resolved');
		});
	});

	describe('reset', () => {
		it('should reset unitialized basic values', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: defaultValue
			});

			handler.reset(store);
			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should reset unitialized function values', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: () => defaultValue
			});

			handler.reset(store);
			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should reset unitialized promise values', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<string, void>();

			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: promiseHandler.promise
			});

			handler.reset(store);
			const actual = handler.read(store);

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(defaultValue);
			await actual.result.promise;

			expect(actual.result.value).toBe(expected);
			expect(actual.result.promise?.status).toBe('resolved');
		});

		it('should reset unitialized promise errors', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<string, string>();

			const key = 'outer-handler';
			const defaultError = 'basic-error';
			const expected = defaultError;

			let handler = atom({
				key,
				default: promiseHandler.promise
			});

			handler.reset(store);
			const actual = handler.read(store);

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.rejecter(defaultError);
			try {
				await actual.result.promise;
			} catch {}

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise?.status).toBe('rejected');
			expect(actual.result.error).toBe(expected);
		});

		it('should reset unitialized handler values', () => {
			let store = new PicoStore();

			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: atom({
					key: 'write-handler',
					default: defaultValue
				})
			});

			handler.reset(store);
			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});
	});

	describe('effects', () => {
		it('should fire events', () => {
			const store = new PicoStore();
			const key = 'atom';
			const defaultValue = 'basic-default';
			const value = 'basic-value';

			const effect: PicoEffect<string> = {
				onCreated: jest.fn(),
				onUpdating: jest.fn(),
				onUpdated: jest.fn(),
				onDeleting: jest.fn()
			};

			const atomHandler = atom({
				key,
				default: defaultValue,
				effects: [effect]
			});

			atomHandler.read(store);

			expect(effect.onCreated).toBeCalledTimes(1);
			expect(effect.onUpdating).toBeCalledTimes(0);
			expect(effect.onUpdated).toBeCalledTimes(0);
			expect(effect.onDeleting).toBeCalledTimes(0);

			atomHandler.save(store, value);

			expect(effect.onCreated).toBeCalledTimes(1);
			expect(effect.onUpdating).toBeCalledTimes(1);
			expect(effect.onUpdated).toBeCalledTimes(1);
			expect(effect.onDeleting).toBeCalledTimes(0);

			store.deletePicoValue(key);

			expect(effect.onCreated).toBeCalledTimes(1);
			expect(effect.onUpdating).toBeCalledTimes(1);
			expect(effect.onUpdated).toBeCalledTimes(1);
			expect(effect.onDeleting).toBeCalledTimes(1);
			expect(store.treeState[key]).toBeUndefined();
		});

		it('should allow reading synchronous values from events', () => {
			const store = new PicoStore();
			const key = 'atom';
			const defaultValue = 'basic-default';
			const value = 'basic-value';

			const effect: PicoEffect<string> = {
				onCreated: jest.fn(({ get }) => {
					expect(get(atomHandler)).toBe(defaultValue);
				}),
				onUpdating: jest.fn(({ get }) => {
					expect(get(atomHandler)).toBe(defaultValue);
				}),
				onUpdated: jest.fn(({ get }) => {
					expect(get(atomHandler)).toBe(value);
				}),
				onDeleting: jest.fn(({ get }) => {
					expect(get(atomHandler)).toBe(value);
				})
			};

			const atomHandler = atom({
				key,
				default: defaultValue,
				effects: [effect]
			});

			atomHandler.read(store);
			atomHandler.save(store, value);
			store.deletePicoValue(key);
		});

		it('should allow reading synchronous values asynchronously from events', async () => {
			const store = new PicoStore();
			const key = 'atom';
			const defaultValue = 'basic-default';
			const value = 'basic-value';

			const effect: PicoEffect<string> = {
				onCreated: jest.fn(({ getAsync }) => {
					const promise = getAsync(atomHandler);
					promise.then((result) => expect(result).toBe(defaultValue));
				}),
				onUpdating: jest.fn(({ getAsync }) => {
					const promise = getAsync(atomHandler);
					promise.then((result) => expect(result).toBe(defaultValue));
				}),
				onUpdated: jest.fn(({ getAsync }) => {
					const promise = getAsync(atomHandler);
					promise.then((result) => expect(result).toBe(value));
				}),
				onDeleting: jest.fn(({ getAsync }) => {
					const promise = getAsync(atomHandler);
					promise.then((result) => expect(result).toBe(value));
				})
			};

			const atomHandler = atom({
				key,
				default: defaultValue,
				effects: [effect]
			});

			atomHandler.read(store);
			atomHandler.save(store, value);
			store.deletePicoValue(key);
		});

		it('should allow reading asynchronous values from events', async () => {
			const store = new PicoStore();
			const key = 'atom';
			const defaultValue = 'basic-default';
			const promiseHandler = createPromise<string, void>();

			const effect: PicoEffect<string> = {
				onCreated: jest.fn(({ getAsync }) => {
					const promise = getAsync(atomHandler);
					promise.then((result) => expect(result).toBe(defaultValue));
				}),
				onUpdating: jest.fn(({ getAsync }) => {
					const promise = getAsync(atomHandler);
					promise.then((result) => expect(result).toBe(defaultValue));
				}),
				onUpdated: jest.fn(({ getAsync }) => {
					const promise = getAsync(atomHandler);
					promise.then((result) => expect(result).toBe(defaultValue));
				}),
				onDeleting: jest.fn(({ getAsync }) => {
					const promise = getAsync(atomHandler);
					promise.then((result) => expect(result).toBe(defaultValue));
				})
			};

			const atomHandler = atom({
				key,
				default: promiseHandler.promise,
				effects: [effect]
			});

			const picoValue = atomHandler.read(store);
			promiseHandler.resolver(defaultValue);
			await picoValue.result.promise;
			store.deletePicoValue(key);
		});

		it('should allow setting values from events', () => {
			const store = new PicoStore();
			const managerKey = 'manager';
			const managedKey = 'atom';
			const defaultValue = 'basic-default';
			const createdValue = 'created-value';
			const updatingValue = 'updating-value';
			const updatedValue = 'updated-value';
			const deletingValue = 'deleted-value';

			const managedValue = atom({
				key: managedKey,
				default: defaultValue
			});

			const effect: PicoEffect<string> = {
				onCreated: jest.fn(({ get, set }) => {
					set(managedValue, createdValue);
					expect(get(managedValue)).toBe(createdValue);
				}),
				onUpdating: jest.fn(({ get, set }) => {
					set(managedValue, updatingValue);
					expect(get(managedValue)).toBe(updatingValue);
				}),
				onUpdated: jest.fn(({ get, set }) => {
					set(managedValue, updatedValue);
					expect(get(managedValue)).toBe(updatedValue);
				}),
				onDeleting: jest.fn(({ get, set }) => {
					set(managedValue, deletingValue);
					expect(get(managedValue)).toBe(deletingValue);
				})
			};

			const atomHandler = atom({
				key: managerKey,
				default: defaultValue,
				effects: [effect]
			});

			atomHandler.read(store);
			atomHandler.save(store, 'ignored');
			store.deletePicoValue(managerKey);
		});

		it('should allow resetting values from events', () => {
			const store = new PicoStore();
			const managerKey = 'manager';
			const managedKey = 'atom';
			const defaultValue = 'basic-default';
			const createdValue = 'created-value';
			const updatingValue = 'updating-value';
			const updatedValue = 'updated-value';
			const deletingValue = 'deleted-value';

			const managedValue = atom({
				key: managedKey,
				default: defaultValue
			});

			const effect: PicoEffect<string> = {
				onCreated: jest.fn(({ get, set, reset }) => {
					set(managedValue, createdValue);
					reset(managedValue);
					expect(get(managedValue)).toBe(defaultValue);
				}),
				onUpdating: jest.fn(({ get, set, reset }) => {
					set(managedValue, updatingValue);
					reset(managedValue);
					expect(get(managedValue)).toBe(defaultValue);
				}),
				onUpdated: jest.fn(({ get, set, reset }) => {
					set(managedValue, updatedValue);
					reset(managedValue);
					expect(get(managedValue)).toBe(defaultValue);
				}),
				onDeleting: jest.fn(({ get, set, reset }) => {
					set(managedValue, deletingValue);
					reset(managedValue);
					expect(get(managedValue)).toBe(defaultValue);
				})
			};

			const atomHandler = atom({
				key: managerKey,
				default: defaultValue,
				effects: [effect]
			});

			atomHandler.read(store);
			atomHandler.save(store, 'ignored');
			store.deletePicoValue(managerKey);
		});
	});

	describe('race', () => {
		it('should handle success race conditions', async () => {
			const store = new PicoStore();
			const key = 'key';
			const firstValue = 'first-value';
			const secondValue = 'second-value';

			const firstHandler = createPromise<string, void>();
			const secondHandler = createPromise<string, void>();

			const handler = atom({
				key,
				default: firstHandler.promise
			});

			const value = handler.read(store);
			const firstPromise = value.result.promise;
			handler.save(store, secondHandler.promise);

			secondHandler.resolver(secondValue);
			await value.result.promise;

			expect(value.result.value).toBe(secondValue);

			firstHandler.resolver(firstValue);
			await firstPromise;

			expect(value.result.value).toBe(secondValue);
		});

		it('should handle error race conditions', async () => {
			const store = new PicoStore();
			const key = 'key';
			const firstError = 'first-error';
			const secondError = 'second-error';

			const firstHandler = createPromise<string, string>();
			const secondHandler = createPromise<string, string>();

			const handler = atom({
				key,
				default: firstHandler.promise
			});

			const value = handler.read(store);
			const firstPromise = value.result.promise;
			handler.save(store, secondHandler.promise);

			secondHandler.rejecter(secondError);
			try {
				await value.result.promise;
			} catch {}

			expect(value.result.error).toBe(secondError);

			firstHandler.rejecter(firstError);
			try {
				await firstPromise;
			} catch {}

			expect(value.result.error).toBe(secondError);
		});
	});
});
