import { createPromise } from '../test-utils/promise';
import { atom, PicoStore } from '../src/core';

process.on('unhandledRejection', console.warn);

describe('atom', () => {
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

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should allow null defaults', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = null;
			const expected = defaultValue;

			let handler = atom({
				key,
				default: defaultValue
			});

			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
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

			expect(actual.result.value).toBe(expected);
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

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(defaultValue);
			await actual.result.promise;

			expect(actual.result.value).toBe(expected);
			expect(actual.result.promise?.status).toBe('resolved');
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
	});

	describe('write', () => {
		it('should write basic values', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedValue = 'basic-value';
			const expected = savedValue;

			let handler = atom({
				key,
				default: defaultValue
			});

			handler.save(store, savedValue);
			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should write null values', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedValue = null;
			const expected = savedValue;

			let handler = atom<string | null>({
				key,
				default: defaultValue
			});

			handler.save(store, savedValue);
			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should write function values', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedValue = 'basic-value';
			const expected = savedValue;

			let handler = atom({
				key,
				default: defaultValue
			});

			handler.save(store, () => savedValue);
			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should write promise values', async () => {
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

			handler.save(store, promiseHandler.promise);
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

		it('should write promise errors', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<string, string>();

			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedError = 'basic-error';
			const expected = savedError;

			let handler = atom({
				key,
				default: defaultValue
			});

			handler.save(store, promiseHandler.promise);
			const actual = handler.read(store);

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.rejecter(savedError);
			try {
				await actual.result.promise;
			} catch {}

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise?.status).toBe('rejected');
			expect(actual.result.error).toBe(expected);
		});

		it('should write handler values', () => {
			let store = new PicoStore();

			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedValue = 'basic-value';
			const expected = savedValue;

			let handler = atom({
				key,
				default: defaultValue
			});

			let writeHandler = atom({
				key: 'write-handler',
				default: savedValue
			});

			handler.save(store, writeHandler);
			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});
	});

	describe('overwrite', () => {
		it('should overwrite basic values', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedValue = 'basic-value';
			const expected = savedValue;

			let handler = atom({
				key,
				default: defaultValue
			});

			const initial = handler.read(store);
			handler.save(store, savedValue);
			const actual = handler.read(store);

			expect(actual).toBe(initial);
			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should overwrite null values', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedValue = null;
			const expected = savedValue;

			let handler = atom<string | null>({
				key,
				default: defaultValue
			});

			const initial = handler.read(store);
			handler.save(store, savedValue);
			const actual = handler.read(store);

			expect(actual).toBe(initial);
			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should overwrite function values', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedValue = 'basic-value';
			const expected = savedValue;

			let handler = atom({
				key,
				default: defaultValue
			});

			const initial = handler.read(store);
			handler.save(store, () => savedValue);
			const actual = handler.read(store);

			expect(actual).toBe(initial);
			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should write promise values', async () => {
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

			const initial = handler.read(store);
			handler.save(store, promiseHandler.promise);
			const actual = handler.read(store);

			expect(actual).toBe(initial);
			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.resolver(savedValue);
			await actual.result.promise;

			expect(actual.result.value).toBe(expected);
			expect(actual.result.promise?.status).toBe('resolved');
		});

		it('should overwrite promise errors', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<string, string>();

			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedError = 'basic-error';
			const expected = savedError;

			let handler = atom({
				key,
				default: defaultValue
			});

			const initial = handler.read(store);
			handler.save(store, promiseHandler.promise);
			const actual = handler.read(store);

			expect(actual).toBe(initial);
			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise).toStrictEqual(promiseHandler.promise);
			expect(actual.result.promise?.status).toBe('pending');
			expect(store.treeState[key]).toBe(actual);

			promiseHandler.rejecter(savedError);
			try {
				await actual.result.promise;
			} catch {}

			expect(actual.result.value).toBeUndefined();
			expect(actual.result.promise?.status).toBe('rejected');
			expect(actual.result.error).toBe(expected);
		});

		it('should overwrite handler values', () => {
			let store = new PicoStore();

			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedValue = 'basic-value';
			const expected = savedValue;

			let handler = atom({
				key,
				default: defaultValue
			});

			let writeHandler = atom({
				key: 'write-handler',
				default: savedValue
			});

			const initial = handler.read(store);
			handler.save(store, writeHandler);
			const actual = handler.read(store);

			expect(actual).toBe(initial);
			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});
	});

	describe('reset', () => {
		it('should reset basic values', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedValue = 'basic-value';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: defaultValue
			});

			handler.save(store, savedValue);
			handler.reset(store);
			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should reset null values', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = null;
			const savedValue = 'basic-value';
			const expected = defaultValue;

			let handler = atom<string | null>({
				key,
				default: defaultValue
			});

			handler.save(store, savedValue);
			handler.reset(store);
			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should reset function values', () => {
			let store = new PicoStore();
			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedValue = 'basic-value';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: () => defaultValue
			});

			handler.save(store, savedValue);
			handler.reset(store);
			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});

		it('should reset promise values', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<string, void>();

			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedValue = 'basic-value';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: promiseHandler.promise
			});

			handler.save(store, savedValue);
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

		it('should reset promise errors', async () => {
			let store = new PicoStore();
			let promiseHandler = createPromise<string, string>();

			const key = 'outer-handler';
			const defaultError = 'basic-error';
			const savedValue = 'basic-value';
			const expected = defaultError;

			let handler = atom({
				key,
				default: promiseHandler.promise
			});

			handler.save(store, savedValue);
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

		it('should reset handler values', () => {
			let store = new PicoStore();

			const key = 'outer-handler';
			const defaultValue = 'basic-default';
			const savedValue = 'basic-value';
			const expected = defaultValue;

			let handler = atom({
				key,
				default: atom({
					key: 'write-handler',
					default: defaultValue
				})
			});

			handler.save(store, savedValue);
			handler.reset(store);
			const actual = handler.read(store);

			expect(actual.result.value).toBe(expected);
			expect(store.treeState[key]).toBe(actual);
		});
	});
});
