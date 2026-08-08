import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  CreditCard, 
  ChevronLeft,
  ChevronRight,
  Boxes,
  ShieldCheck
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { toggleSidebar } from '@/redux/slices/uiSlice';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgencyStoreSwitcher } from './agency-store-switcher/agency-store-switcher';
import { useGetAgencyStoresQuery, useInviteStoreMutation } from '@/redux/api';

const navItems = [
  { name: 'Overview', href: '/agency/dashboard', icon: LayoutDashboard },
  { name: 'Stores', href: '/agency/stores', icon: Store },
  { name: 'Team', href: '/agency/team', icon: Users },
  { name: 'Billing', href: '/agency/billing', icon: CreditCard },
  { name: 'Audit Logs', href: '/agency/audit', icon: ShieldCheck },
];

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const dispatch = useAppDispatch();
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  
  const { data: storesData } = useGetAgencyStoresQuery();
  const stores = storesData?.stores || [];

  const handleSelectStore = async (storeId: string) => {
    const targetStore = stores.find((s: any) => s.id === storeId);
    if (!targetStore) return;

    if (targetStore.status === 'pending') {
      alert("This store is pending merchant authorization. Please wait for confirmation.");
      return;
    }

    try {
      const response = await fetch('/api/agency/member-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: 'AGENCY-849201',
          memberId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Standard member UUID for dev
          tenantId: targetStore.id
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Login denied.");
      }

      if (result.redirectUrl) {
        window.open(result.redirectUrl, '_blank');
      }
    } catch (err: any) {
      alert(`RBAC Access Denied: ${err.message}`);
    }
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-background border-r transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-20 hidden md:flex"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b">
        <Link to="/agency/dashboard" className="flex items-center gap-2 overflow-hidden">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md flex-shrink-0">
            <Boxes className="h-5 w-5" />
          </div>
          {sidebarOpen && <span className="font-semibold text-lg whitespace-nowrap">BentoCo Agency</span>}
        </Link>
      </div>

      {sidebarOpen && (
        <div className="px-3 pt-3 pb-1 border-b">
          <AgencyStoreSwitcher 
            managedStores={stores}
            onSelectStore={handleSelectStore}
          />
        </div>
      )}

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname?.startsWith(`${item.href}/`) ?? false);
            return (
              <Link key={item.name} to={item.href}>
                <span
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive 
                      ? "bg-secondary text-secondary-foreground font-medium" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                    !sidebarOpen && "justify-center px-2"
                  )}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.name}</span>}
                </span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t flex flex-col gap-2">
        <button
          onClick={async () => {
            // Agency session logout action
            window.location.href = '/login';
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-red-400 hover:bg-red-950/20 transition-colors w-full text-left font-medium",
            !sidebarOpen && "justify-center px-2"
          )}
          title={!sidebarOpen ? "Log Out" : undefined}
        >
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          {sidebarOpen && <span>Log Out</span>}
        </button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => dispatch(toggleSidebar())}
          className="hidden md:flex self-end"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
