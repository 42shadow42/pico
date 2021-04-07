import { atomFamily } from '../src/core/atoms';

describe('atom-family', () => {
	describe('initialize', () => {
		it('should initialize handlers per key', () => {
			const family = atomFamily<string>({
				key: 'my-family',
				default: 'my-default'
			});

			const handler1 = family('1');
			const handler2 = family('2');

			expect(handler1 === handler2).toBeFalsy();
		});
	});
});
