export type ObservableSetSubscriber<T> = (value: T) => void;

export class ObservableSet<T> extends Set<T> {
	private subscribers = new Set<ObservableSetSubscriber<T>>();

	constructor(values?: Iterable<T> | null) {
		super(values);
	}

	add = (value: T): this => {
		new Set(this.subscribers).forEach((subscriber) => subscriber(value));
		return super.add(value);
	};

	clear = () => {
		super.clear();
	};

	delete = (value: T): boolean => {
		const result = super.delete(value);
		new Set(this.subscribers).forEach((subscriber) => subscriber(value));
		return result;
	};

	subscribe = (subscriber: ObservableSetSubscriber<T>) => {
		this.subscribers.add(subscriber);
	};

	unsubscribe = (subscriber: ObservableSetSubscriber<T>) => {
		this.subscribers.delete(subscriber);
	};
}
