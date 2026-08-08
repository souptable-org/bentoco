import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCommandPaletteOpen } from '@/redux/slices/uiSlice';
import { LayoutDashboard, LayoutGrid, Users, CreditCard, Share2, Plus } from 'lucide-react';
import { useModKey } from '@/hooks/use-mod-key';

export function CommandPalette() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.commandPaletteOpen);
  const modKey = useModKey();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        dispatch(setCommandPaletteOpen(true));
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [dispatch]);

  const runCommand = React.useCallback((command: () => void) => {
    dispatch(setCommandPaletteOpen(false));
    command();
  }, [dispatch]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={(val) => dispatch(setCommandPaletteOpen(val))}
      title="Search"
      description="Jump to a page or action"
    >
      <CommandInput placeholder={`Search or jump… (${modKey}+K)`} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate('/agency/dashboard'))}>
            <LayoutDashboard />
            <span>Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/agency/stores'))}>
            <LayoutGrid />
            <span>Stores</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/agency/team'))}>
            <Users />
            <span>Team</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/agency/billing'))}>
            <CreditCard />
            <span>Billing</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/agency/referral'))}>
            <Share2 />
            <span>Referral</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => navigate('/agency/stores'))}>
            <Plus />
            <span>Create new store</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/agency/team'))}>
            <Users />
            <span>Invite team member</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
