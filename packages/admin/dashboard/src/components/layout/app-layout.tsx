'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';
import { useAppSelector } from '@/redux/hooks';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/shared/command-palette';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useAppSelector((state) => state.ui);

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:pl-64" : "md:pl-20"
        )}
      >
        <TopNav />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
