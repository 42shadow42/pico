import { selectorFamily } from '../src/core';

describe('selector-family', () => {
	describe('initialize', () => {
		it('should initialize read-only handlers per key', () => {
			const family = selectorFamily<string>({
				key: 'my-family',
				get: () => () => 'my-default'
			});

			const handler1 = family('1');
			const handler2 = family('2');

			expect(handler1 === handler2).toBeFalsy();
		});

		it('should initialize read-write handlers per key', () => {
			const family = selectorFamily<string>({
				key: 'my-family',
				get: () => () => 'my-default',
				set: () => () => {},
				reset: () => () => {}
			});

			const handler1 = family('1');
			const handler2 = family('2');

			expect(handler1 === handler2).toBeFalsy();
		});
	});
});
