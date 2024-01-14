type NotifyCallback = () => void;
type NotifyFunction = (callback: () => void) => void;
type BatchNotifyFunction = (callback: () => void) => void;
type BatchCallsCallback<T extends Array<unknown>> = (...args: T) => void;
type ScheduleFunction = (callback: () => void) => void;
declare function createNotifyManager(): {
    readonly batch: <T>(callback: () => T) => T;
    readonly batchCalls: <T_1 extends unknown[]>(callback: BatchCallsCallback<T_1>) => BatchCallsCallback<T_1>;
    readonly schedule: (callback: NotifyCallback) => void;
    readonly setNotifyFunction: (fn: NotifyFunction) => void;
    readonly setBatchNotifyFunction: (fn: BatchNotifyFunction) => void;
    readonly setScheduler: (fn: ScheduleFunction) => void;
};
declare const notifyManager: {
    readonly batch: <T>(callback: () => T) => T;
    readonly batchCalls: <T_1 extends unknown[]>(callback: BatchCallsCallback<T_1>) => BatchCallsCallback<T_1>;
    readonly schedule: (callback: NotifyCallback) => void;
    readonly setNotifyFunction: (fn: NotifyFunction) => void;
    readonly setBatchNotifyFunction: (fn: BatchNotifyFunction) => void;
    readonly setScheduler: (fn: ScheduleFunction) => void;
};

export { createNotifyManager, notifyManager };
