import * as React from "react"
import { ShieldAlert, ArrowUpDown, RefreshCw } from "lucide-react"
import { useGetAccessLogQuery } from "@/redux/api"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function AgencyAuditLogView() {
  const agencyId =
    typeof window !== "undefined"
      ? localStorage.getItem("bentoco_agency_uid") || "AGENCY-849201"
      : "AGENCY-849201"

  // Query all agency logs without tenant filtering
  const { data, isLoading, refetch, isFetching } = useGetAccessLogQuery({
    agencyId,
  })

  const logs = data?.logs || []

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Security Audit Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time immutable ledger of agency staff members accessing client store admin panels.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          disabled={isFetching}
          className="bg-card text-card-foreground border"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Client Store</TableHead>
              <TableHead>Access Time</TableHead>
              <TableHead>IP Origin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Fetching audit logs...
                </TableCell>
              </TableRow>
            ) : logs.length > 0 ? (
              logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium text-foreground">
                    {log.member_email}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {log.store_name?.slice(0, 2).toUpperCase() || "ST"}
                      </div>
                      <span className="font-semibold">{log.store_name || "Unknown Store"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono">
                    {format(new Date(log.created_at), "MMM d, yyyy, h:mm a")}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono">
                    {log.ip_address}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ShieldAlert className="h-8 w-8 text-muted-foreground/60" />
                    <span>No access logs recorded yet.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default AgencyAuditLogView
