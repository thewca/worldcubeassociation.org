type Listener = () => void;
declare class Subscribable<TListener extends Function = Listener> {
    protected listeners: Set<TListener>;
    constructor();
    subscribe(listener: TListener): () => void;
    hasListeners(): boolean;
    protected onSubscribe(): void;
    protected onUnsubscribe(): void;
}

export { Subscribable };
