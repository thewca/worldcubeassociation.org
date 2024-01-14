import { DefaultError, InfiniteData, QueryKey, DataTag } from '@tanstack/query-core';
import { UseInfiniteQueryOptions } from './types.cjs';

type UndefinedInitialDataInfiniteOptions<TQueryFnData, TError = DefaultError, TData = InfiniteData<TQueryFnData>, TQueryKey extends QueryKey = QueryKey, TPageParam = unknown> = UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, TPageParam> & {
    initialData?: undefined;
};
type NonUndefinedGuard<T> = T extends undefined ? never : T;
type DefinedInitialDataInfiniteOptions<TQueryFnData, TError = DefaultError, TData = InfiniteData<TQueryFnData>, TQueryKey extends QueryKey = QueryKey, TPageParam = unknown> = UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, TPageParam> & {
    initialData: NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>> | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>);
};
declare function infiniteQueryOptions<TQueryFnData, TError = DefaultError, TData = InfiniteData<TQueryFnData>, TQueryKey extends QueryKey = QueryKey, TPageParam = unknown>(options: UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
    queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>>;
};
declare function infiniteQueryOptions<TQueryFnData, TError = DefaultError, TData = InfiniteData<TQueryFnData>, TQueryKey extends QueryKey = QueryKey, TPageParam = unknown>(options: DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
    queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>>;
};

export { type DefinedInitialDataInfiniteOptions, type UndefinedInitialDataInfiniteOptions, infiniteQueryOptions };
