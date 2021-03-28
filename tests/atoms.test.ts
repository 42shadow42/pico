import { createPromise } from '../src/test-utils/promise';
import { atom } from '../src/core/atoms';
import { PicoStore } from '../src/core/store';
import { selector } from '../src/core/selectors';

process.on('unhandledRejection', console.warn);

describe('atom handler', () => {
	describe('read', () => {
		it('should apply basic defaults', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: defaultValue
			});

			const actual = handler.read(store);

			expect(actual.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should apply function defaults', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: () => defaultValue
			});

			const actual = handler.read(store);

			expect(actual.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should apply promise defaults', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<string, void>();

			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: promiseHandler.promise
			});

			const actual = handler.read(store);

			expect(actual.value).toBeUndefined();
			expect(actual.promise).toBe(promiseHandler.promise);
			expect(actual.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(defaultValue);
			await promiseHandler.promise;

			expect(actual.value).toBe(expected);
			expect(actual.promise?.status).toBe('resolved');
		});

		it('should apply promise errors', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<void, string>();

			const key = 'outer-handler';
			const error = 'basic-default';
			const expected = error;

			let handler = atom({
				key,
				default: promiseHandler.promise
			});

			const actual = handler.read(store);

			expect(actual.value).toBeUndefined();
			expect(actual.promise).toBe(promiseHandler.promise);
			expect(actual.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.rejecter(error);
			try {
				await promiseHandler.promise;
			} catch {}

			expect(actual.value).toBeUndefined();
			expect(actual.promise?.status).toBe('rejected');
			expect(actual.error).toBe(expected);
		});

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

			expect(actual.value).toBe(expected);
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

			expect(actual.value).toBe(expected);
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

			expect(actual.value).toBeUndefined();
			expect(actual.promise).toBe(promiseHandler.promise);
			expect(actual.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(defaultValue);
			await promiseHandler.promise;

			expect(actual.value).toBe(expected);
			expect(actual.promise?.status).toBe('resolved');
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

			expect(actual.value).toBeUndefined();
			expect(actual.promise).toBe(promiseHandler.promise);
			expect(actual.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.rejecter(error);
			try {
				await promiseHandler.promise;
			} catch {}

			expect(actual.value).toBeUndefined();
			expect(actual.promise?.status).toBe('rejected');
			expect(actual.error).toBe(expected);
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

			expect(actual.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

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
			// expect(actual.promise).toBe(promiseHandler.promise);
			// expect(actual.promise?.status).toBe("pending")
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(defaultValue);
			await promiseHandler.promise;

			expect(actual.value).toBe(expected);
			expect(actual.promise?.status).toBe('resolved');
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

			expect(actual.value).toBeUndefined();
			expect(actual.promise).toBe(promiseHandler.promise);
			expect(actual.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.rejecter(error);
			try {
				await promiseHandler.promise;
			} catch {}

			expect(actual.value).toBeUndefined();
			expect(actual.promise?.status).toBe('rejected');
			expect(actual.error).toBe(expected);
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

			expect(actual.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});
	});
});
