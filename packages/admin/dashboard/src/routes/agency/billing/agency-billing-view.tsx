import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, ExternalLink, TrendingUp, History } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetAgencyBillingQuery } from '@/redux/api';
import { agencyTrendClass, agencyTrendIconClass } from '@/lib/agency-status-styles';
import { cn } from '@/lib/utils';

export function AgencyBillingView() {
  const { data, isLoading, isError } = useGetAgencyBillingQuery();

  // No fake Visa / USD demo figures — only live metering or honest empty state
  const monthlyCharges = data?.monthlyCharges ?? "—";
  const volumeDiscount = data?.volumeDiscount ?? "—";
  const paymentMethod = data?.paymentMethod ?? "Not configured";
  const activeSites = data?.activeSites ?? 0;
  const stagingSites = data?.stagingSites ?? 0;
  const pricePerSite = data?.pricePerActiveSiteInr ?? 2499;
  const invoices = Array.isArray(data?.invoices) ? data.invoices : [];
  const note = data?.note as string | undefined;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Billing & Usage</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading
              ? "Fetching live metering…"
              : isError
                ? "Could not load billing — check API."
                : "Per-active-site metering for agency client stores (INR)."}
          </p>
        </div>
      </div>

      {note && (
        <p className="text-xs text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
          {note}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle as="div" className="text-sm font-medium text-muted-foreground">Estimated monthly (active sites)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monthlyCharges}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {activeSites} active × ₹{pricePerSite.toLocaleString("en-IN")}
              {stagingSites > 0 ? ` · ${stagingSites} staging (not billed)` : ""}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle as="div" className="text-sm font-medium text-muted-foreground">Volume Discount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{volumeDiscount}</div>
            <p className="text-sm text-muted-foreground mt-1">
              5+ sites = 15% · 20+ sites = 30%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle as="div" className="text-sm font-medium text-muted-foreground">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-14 bg-secondary rounded flex items-center justify-center">
                 <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{paymentMethod}</p>
                <p className="text-xs text-muted-foreground">Razorpay / autopay — Phase 5 follow-up</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Card className="md:col-span-2">
           <CardHeader>
             <CardTitle as="h2">Usage History</CardTitle>
             <CardDescription>Monthly spend breakdown over the last 6 months.</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="h-[300px] w-full bg-muted/20 border border-dashed rounded flex items-center justify-center">
                <span className="text-muted-foreground text-sm flex items-center gap-2"><History className="h-4 w-4" /> Metered Agency Usage Analytics Active</span>
             </div>
           </CardContent>
         </Card>
         
         <Card>
           <CardHeader>
             <CardTitle as="h2">Recent Invoices</CardTitle>
           </CardHeader>
           <CardContent className="p-0">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="pl-6">Invoice</TableHead>
                   <TableHead>Amount</TableHead>
                   <TableHead className="text-right pr-6"></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {invoices.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={3} className="pl-6 py-8 text-sm text-muted-foreground text-center">
                       No invoices yet — payment capture not connected.
                     </TableCell>
                   </TableRow>
                 )}
                 {invoices.map((invoice: any) => (
                   <TableRow key={invoice.id}>
                     <TableCell className="pl-6">
                       <div className="font-medium text-sm">{invoice.id}</div>
                       <div className="text-xs text-muted-foreground">{invoice.date}</div>
                     </TableCell>
                     <TableCell className="text-sm">{invoice.amount}</TableCell>
                     <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}

export default AgencyBillingView;
