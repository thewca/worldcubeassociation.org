/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function QueryClientProviderWrapper(Component, props) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...props} />
    </QueryClientProvider>
  );
}
