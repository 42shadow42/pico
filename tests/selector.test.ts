import { atom } from '../src/core/atoms';
import { selector } from '../src/core/selectors';
import { PicoStore } from '../src/core/store';
import { createPromise } from '../test-utils/promise';

describe('selector', () => {
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
});
