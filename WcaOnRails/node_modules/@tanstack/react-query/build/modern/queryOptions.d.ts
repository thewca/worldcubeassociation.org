import { DefaultError, QueryKey, DataTag } from '@tanstack/query-core';
import { UseQueryOptions } from './types.js';

type UndefinedInitialDataOptions<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData?: undefined;
};
type NonUndefinedGuard<T> = T extends undefined ? never : T;
type DefinedInitialDataOptions<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData: NonUndefinedGuard<TQueryFnData> | (() => NonUndefinedGuard<TQueryFnData>);
};
declare function queryOptions<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
    queryKey: DataTag<TQueryKey, TQueryFnData>;
};
declare function queryOptions<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
    queryKey: DataTag<TQueryKey, TQueryFnData>;
};

export { type DefinedInitialDataOptions, type UndefinedInitialDataOptions, queryOptions };
