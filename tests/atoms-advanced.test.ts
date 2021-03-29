import { atom } from '../src/core/atoms';
import { PicoStore } from '../src/core/store';
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
			expect(actual.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(defaultValue);
			await actual.promise;

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
			expect(actual.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.rejecter(error);
			try {
				await actual.promise;
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

			expect(actual.value).toBeUndefined();
			expect(actual.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(savedValue);
			await actual.promise;

			expect(actual.value).toBe(expected);
			expect(actual.promise?.status).toBe('resolved');
		});

		it('should reset unresolved handler promise values', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<string, void>();

			const key = 'outer-handler';
			const defaultValue = 'basic-default';
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

			expect(actual.value).toBeUndefined();
			expect(actual.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(savedValue);
			await actual.promise;

			expect(actual.value).toBe(expected);
			expect(actual.promise?.status).toBe('resolved');
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

			expect(actual.value).toBe(expected);
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

			expect(actual.value).toBe(expected);
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

			expect(actual.value).toBeUndefined();
			expect(actual.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(defaultValue);
			await actual.promise;

			expect(actual.value).toBe(expected);
			expect(actual.promise?.status).toBe('resolved');
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

			expect(actual.value).toBeUndefined();
			expect(actual.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.rejecter(defaultError);
			try {
				await actual.promise;
			} catch {}

			expect(actual.value).toBeUndefined();
			expect(actual.promise?.status).toBe('rejected');
			expect(actual.error).toBe(expected);
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

			expect(actual.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});
	});
});
