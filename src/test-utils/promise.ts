export type Resolver<TResult> = (result: TResult) => void;
export type Rejecter<TError> = (error: TError) => void;

export interface PromiseHandler<TResult, TError> {
	promise: Promise<TResult>;
	resolver: Resolver<TResult>;
	rejecter: Rejecter<TError>;
}

export function createPromise<TResult, TError>(): PromiseHandler<
	TResult,
	TError
> {
	let resolver: Resolver<TResult> | undefined;
	let rejecter: Rejecter<TError> | undefined;

	let promise = new Promise(
		(resolve: Resolver<TResult>, reject: Rejecter<TError>) => {
			resolver = resolve;
			rejecter = reject;
		}
	);

	return {
		promise,
		resolver: resolver as Resolver<TResult>,
		rejecter: rejecter as Rejecter<TError>
	};
}
