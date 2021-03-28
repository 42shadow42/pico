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
});
