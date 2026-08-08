import * as React from "react";
import { paisaToInr } from "@/lib/currency";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Store, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  useGetAgencyStoresQuery,
  useRevokeAgencyAccessMutation,
  useAcceptAgencyLinkMutation,
} from "@/redux/api";
import { AddClientStoreModal } from "@/components/modals/add-client-store-modal";
import { MerchantStoreOnboardingModal } from "@/components/modals/merchant-store-onboarding-modal";
import {
  merchantOpenAriaLabel,
  openMerchantStore,
} from "@/lib/agency-store-url";
import {
  agencyStatusBadgeClass,
  agencyStatusLabel,
} from "@/lib/agency-status-styles";

type ClientStore = {
  id: string;
  tenantId?: string;
  subdomain?: string;
  name: string;
  status:
    | "active"
    | "new"
    | "staging"
    | "suspended"
    | "archived"
    | "revoke_requested"
    | string;
  accessStatus?: string;
  owner: string;
  plan: "Basic" | "Pro" | "Enterprise" | string;
  monthlyRevenue: number;
  monthlyRevenuePaisa?: number;
  lastActivity: string;
  agencyUid?: string;
};

function getAgencyActorEmail(): string {
  if (typeof window === "undefined") return "agency@unknown.local";
  try {
    const membership = localStorage.getItem("bentoco_agency_membership");
    if (membership) {
      const m = JSON.parse(membership);
      if (m?.email) return String(m.email);
    }
  } catch {
    // ignore
  }
  try {
    const meta = localStorage.getItem("bentoco_agency_store_session_meta");
    if (meta) {
      const m = JSON.parse(meta);
      if (m?.memberEmail) return String(m.memberEmail);
    }
  } catch {
    // ignore
  }
  return localStorage.getItem("bentoco_agency_email") || "agency@unknown.local";
}

export function AgencyStoresView() {
  const agencyUid =
    typeof window !== "undefined"
      ? localStorage.getItem("bentoco_agency_uid") || "AGENCY-849201"
      : "AGENCY-849201";
  const { data, isLoading, isSuccess, refetch } =
    useGetAgencyStoresQuery(agencyUid);
  const [acceptRevoke, { isLoading: isAcceptingRevoke }] =
    useRevokeAgencyAccessMutation();
  const [acceptLink, { isLoading: isAcceptingLink }] =
    useAcceptAgencyLinkMutation();
  const isAccepting = isAcceptingRevoke || isAcceptingLink;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [configureStore, setConfigureStore] =
    React.useState<ClientStore | null>(null);

  const handleAcceptLink = React.useCallback(
    async (store: ClientStore) => {
      const tenantId = store.tenantId || store.id;
      const uid = store.agencyUid || agencyUid;
      if (!tenantId) {
        alert("Missing store id.");
        return;
      }
      const ok = window.confirm(
        `Accept access request for "${store.name}"?\n\nYou will be able to open merchant admin for this store.`
      );
      if (!ok) return;

      try {
        await acceptLink({
          agencyId: uid,
          tenantId,
          acceptedByEmail: getAgencyActorEmail(),
        }).unwrap();
        alert("Access accepted. You can open this store now.");
        void refetch();
      } catch (e: any) {
        alert(e?.data?.error || e?.message || "Could not accept access request.");
      }
    },
    [acceptLink, agencyUid, refetch]
  );

  const handleAcceptRevoke = React.useCallback(
    async (store: ClientStore) => {
      const tenantId = store.tenantId || store.id;
      const uid = store.agencyUid || agencyUid;
      if (!tenantId) {
        alert("Missing store id for revoke.");
        return;
      }
      const ok = window.confirm(
        `Accept revoke for "${store.name}"?\n\nThis permanently ends agency access to this store. Merchant stays independent.`
      );
      if (!ok) return;

      try {
        await acceptRevoke({
          agencyId: uid,
          tenantId,
          revokedByEmail: getAgencyActorEmail(),
        }).unwrap();
        alert("Revoke accepted. Store access ended.");
        void refetch();
      } catch (e: any) {
        alert(e?.data?.error || e?.message || "Could not accept revoke.");
      }
    },
    [acceptRevoke, agencyUid, refetch]
  );

  const columns: ColumnDef<ClientStore>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Store Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-2 px-4">
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{row.getValue("name")}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {row.original.id}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge
              variant="secondary"
              className={cn("border", agencyStatusBadgeClass(status))}
            >
              {agencyStatusLabel(status)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "owner",
        header: "Owner",
        cell: ({ row }) => (
          <div className="lowercase">{row.getValue("owner")}</div>
        ),
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => <div>{row.getValue("plan")}</div>,
      },
      {
        accessorKey: "monthlyRevenuePaisa",
        header: () => <div className="text-right">Monthly Revenue</div>,
        cell: ({ row }) => {
          const paisa = row.getValue("monthlyRevenuePaisa") as number;
          return (
            <div className="text-right font-mono font-medium">
              {paisaToInr(paisa)}
            </div>
          );
        },
      },
      {
        accessorKey: "lastActivity",
        header: "Last Activity",
        cell: ({ row }) => {
          const date = new Date(row.getValue("lastActivity"));
          return (
            <div className="text-muted-foreground">
              {format(date, "MMM d, yyyy")}
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const store = row.original;
          const status = String(store.status || "").toLowerCase();
          const accessStatus = String(store.accessStatus || "").toUpperCase();
          const isPendingAccess =
            status === "pending" ||
            status === "staging" ||
            accessStatus === "PENDING";
          const isNewStore =
            status === "new" || accessStatus === "NEW";
          const isRevokeRequested =
            status === "revoke_requested" ||
            accessStatus === "REVOKE_REQUESTED";
          const canOpen =
            !isPendingAccess &&
            (isNewStore ||
              status === "active" ||
              accessStatus === "ACTIVE" ||
              isRevokeRequested);

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "agency-touch-target size-auto p-0"
                )}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(store.id)}
                >
                  Copy Master UID
                </DropdownMenuItem>

                {isPendingAccess && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={isAccepting}
                      onClick={() => void handleAcceptLink(store)}
                    >
                      Accept access request
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled
                      className="text-muted-foreground opacity-80"
                    >
                      Waiting for merchant signup / code
                    </DropdownMenuItem>
                  </>
                )}

                {isNewStore && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setConfigureStore(store)}
                    >
                      Configure store
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        void openMerchantStore({
                          tenantId: store.tenantId || store.id,
                          subdomain: store.subdomain,
                          storeName: store.name,
                        });
                      }}
                    >
                      Open merchant admin
                      <span className="ml-auto text-xs text-muted-foreground">
                        (new tab)
                      </span>
                    </DropdownMenuItem>
                  </>
                )}

                {canOpen && !isNewStore && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        void openMerchantStore({
                          tenantId: store.tenantId || store.id,
                          subdomain: store.subdomain,
                          storeName: store.name,
                        });
                      }}
                      aria-label={merchantOpenAriaLabel(store.name)}
                    >
                      Open merchant admin
                      <span className="ml-auto text-xs text-muted-foreground">
                        (new tab)
                      </span>
                    </DropdownMenuItem>
                  </>
                )}

                {isRevokeRequested && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      disabled={isAccepting}
                      onClick={() => void handleAcceptRevoke(store)}
                    >
                      Accept revoke
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleAcceptLink, handleAcceptRevoke, isAccepting]
  );

  // Prefer live API data; only fall back to demo rows if the request failed open
  const tableData: ClientStore[] = React.useMemo(() => {
    if (Array.isArray(data?.stores)) {
      return data.stores.map((s: any) => ({
        id: s.id,
        tenantId: s.tenant_id || s.tenantId || s.id,
        subdomain: s.subdomain || "",
        name: s.name,
        status: s.status,
        accessStatus: s.accessStatus,
        owner: s.owner,
        plan:
          String(s.plan || "free").charAt(0).toUpperCase() +
          String(s.plan || "free").slice(1),
        monthlyRevenue: Math.round((s.monthlyRevenuePaisa || 0) / 100),
        monthlyRevenuePaisa: s.monthlyRevenuePaisa || 0,
        lastActivity: s.lastActivity || new Date().toISOString(),
        agencyUid: s.agencyUid || agencyUid,
      }));
    }
    if (isSuccess) {
      return [];
    }
    return [
      {
        id: "demo",
        name: "Demo store (API unavailable)",
        status: "staging" as const,
        owner: "—",
        plan: "Basic" as const,
        monthlyRevenue: 0,
        lastActivity: new Date().toISOString(),
      },
    ];
  }, [data, isSuccess, agencyUid]);

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full max-w-7xl mx-auto">
      <MerchantStoreOnboardingModal
        open={!!configureStore}
        onOpenChange={(open) => {
          if (!open) setConfigureStore(null)
        }}
        tenantId={configureStore?.tenantId || configureStore?.id || ""}
        agencyId={configureStore?.agencyUid || agencyUid}
        configuredByEmail={getAgencyActorEmail()}
        initialStoreName={configureStore?.name || ""}
        mode="agency"
        onComplete={() => {
          setConfigureStore(null)
          void refetch()
        }}
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Client Stores</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading ? "Fetching live client store roster..." : "Manage and monitor all client stores."}
          </p>
        </div>
        <AddClientStoreModal 
          trigger={
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
              <Plus className="mr-2 h-4 w-4 text-white" /> New Store
            </Button>
          }
        />
      </div>

      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter stores by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline" }), "ml-auto")}>
            Columns <ChevronDown className="ml-2 h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AgencyStoresView;
