import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </Provider>
  );
}
