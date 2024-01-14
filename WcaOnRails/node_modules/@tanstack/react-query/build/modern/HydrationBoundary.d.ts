import * as React from 'react';
import { HydrateOptions, QueryClient } from '@tanstack/query-core';

interface HydrationBoundaryProps {
    state?: unknown;
    options?: Omit<HydrateOptions, 'defaultOptions'> & {
        defaultOptions?: Omit<HydrateOptions['defaultOptions'], 'mutations'>;
    };
    children?: React.ReactNode;
    queryClient?: QueryClient;
}
declare const HydrationBoundary: ({ children, options, state, queryClient, }: HydrationBoundaryProps) => React.ReactElement<any, string | React.JSXElementConstructor<any>>;

export { HydrationBoundary, type HydrationBoundaryProps };
