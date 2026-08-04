import React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Plus,
  Search,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Users,
  RefreshCw,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetAgencyTeamQuery } from "@/redux/api"
import { agencyMemberStatusBadgeClass } from "@/lib/agency-status-styles"
import {
  AGENCY_DEMO_TEAM_BANNER,
  DEMO_TEAM_MEMBERS,
  type DemoTeamMember,
} from "@/lib/agency-demo"
import { getAgencyUid } from "@/lib/agency-session"

import { GiveTemporaryAccessModal } from "@/components/modals/give-temporary-access-modal"

type TeamMember = DemoTeamMember & { id: string | number }

type RosterMode = "loading" | "live" | "empty" | "error-demo"

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function resolveRoster(args: {
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  members: unknown
}): { mode: RosterMode; members: TeamMember[] } {
  const { isLoading, isError, isSuccess, members } = args

  if (isLoading) {
    return { mode: "loading", members: [] }
  }

  if (isSuccess && Array.isArray(members)) {
    if (members.length === 0) {
      return { mode: "empty", members: [] }
    }
    return { mode: "live", members: members as TeamMember[] }
  }

  if (isError || isSuccess) {
    return { mode: "error-demo", members: DEMO_TEAM_MEMBERS }
  }

  return { mode: "loading", members: [] }
}

function isInvited(member: TeamMember) {
  return String(member.status).toLowerCase() === "invited"
}

function isOwner(member: TeamMember) {
  return member.role === "AGENCY_OWNER"
}

function MemberRow({
  member,
  isDemo,
}: {
  member: TeamMember
  isDemo: boolean
}) {
  const invited = isInvited(member)
  const owner = isOwner(member)
  // Destructive actions not wired yet — honest disabled labels (demo + live)
  const destructiveLabel = invited ? "Cancel invite" : "Remove"
  const destructiveHint = isDemo
    ? "Demo only — not available"
    : "Not available yet"

  return (
    <TableRow>
      <TableCell className="pl-6">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback aria-hidden>{initials(member.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{member.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {member.email}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {owner ? (
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          ) : (
            <ShieldAlert
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          )}
          <span className="text-sm">{member.role.replace(/_/g, " ")}</span>
        </div>
      </TableCell>
      <TableCell className="max-w-[12rem] truncate text-sm">
        {member.stores}
      </TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={cn("border", agencyMemberStatusBadgeClass(member.status))}
        >
          {member.status}
        </Badge>
      </TableCell>
      <TableCell className="pr-6 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "agency-touch-target size-auto p-0"
            )}
          >
            <span className="sr-only">Open menu for {member.name}</span>
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem disabled title="Not available yet">
              View profile
            </DropdownMenuItem>
            <DropdownMenuItem disabled title="Not available yet">
              Edit access
            </DropdownMenuItem>
            
            {member.status === "Active" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    // Trigger modal via custom click handler, avoiding Radix nesting completely
                    const btn = document.getElementById(`temp-access-trigger-${member.id}`);
                    if (btn) (btn as HTMLButtonElement).click();
                  }}
                >
                  Give Temporary Access
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled
              title={
                owner
                  ? "Agency owners cannot be removed from this menu"
                  : destructiveHint
              }
              className="text-destructive focus:text-destructive data-[disabled]:opacity-50"
            >
              {owner ? "Remove (owner protected)" : destructiveLabel}
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {owner ? "Protected" : isDemo ? "Demo" : "Soon"}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {member.status === "Active" && (
          <div className="hidden">
            <GiveTemporaryAccessModal
              memberEmail={member.email}
              memberName={member.name}
              trigger={
                <button id={`temp-access-trigger-${member.id}`}>
                  Trigger Access
                </button>
              }
            />
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={`skeleton-${i}`} aria-hidden>
          <TableCell className="pl-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell className="pr-6 text-right">
            <Skeleton className="ml-auto h-8 w-8 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function EmptyRoster() {
  return (
    <TableRow>
      <TableCell colSpan={5} className="h-48">
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No team members yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Invite staff to give them access to client stores. Your live roster
              is empty — this is not sample data.
            </p>
          </div>
          <Button
            variant="default"
            type="button"
            disabled
            title="Invite is not wired yet"
            className="agency-touch-target min-h-9 w-auto px-4"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Invite Member
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function AgencyTeamView() {
  const { data, isLoading, isError, isSuccess, isFetching, refetch } =
    useGetAgencyTeamQuery(getAgencyUid() || "AGENCY-849201")

  const { mode, members } = resolveRoster({
    isLoading: isLoading && !data,
    isError,
    isSuccess,
    members: data?.members,
  })

  const isDemo = mode === "error-demo"
  const showTableBody = mode === "live" || mode === "error-demo"

  const subtitle =
    mode === "loading"
      ? "Loading agency staff…"
      : mode === "empty"
        ? "Your live roster has no members yet."
        : "Manage agency staff and their access."

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">Team Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button
          variant="default"
          type="button"
          disabled
          title="Invite is not wired yet"
          className="agency-touch-target min-h-9 w-auto shrink-0 px-4"
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden /> Invite Member
        </Button>
      </div>

      {isDemo && (
        <Alert className="border-border bg-muted/40 text-foreground">
          <AlertCircle className="text-muted-foreground" aria-hidden />
          <AlertTitle className="text-sm font-medium">Sample roster</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">{AGENCY_DEMO_TEAM_BANNER}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="agency-touch-target h-auto min-h-9 w-fit shrink-0 px-3"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={cn(
                  "mr-2 h-3.5 w-3.5",
                  isFetching && "animate-spin"
                )}
                aria-hidden
              />
              {isFetching ? "Retrying…" : "Retry"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full min-w-0 sm:max-w-xs sm:flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Search members..."
                className="h-9 pl-9"
                aria-label="Search members"
                disabled
                title="Search is not wired yet"
              />
            </div>
            <Button
              variant="outline"
              type="button"
              disabled
              title="Filter is not wired yet"
              className="agency-touch-target h-auto min-h-9 w-full shrink-0 px-3 sm:w-auto"
            >
              Filter Roles
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Stores</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mode === "loading" && <LoadingRows />}
                {mode === "empty" && <EmptyRoster />}
                {showTableBody &&
                  members.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      isDemo={isDemo}
                    />
                  ))}
              </TableBody>
            </Table>
          </div>
          {(isDemo || mode === "live") && (
            <p className="border-t border-border px-6 py-2 text-xs text-muted-foreground">
              {isDemo
                ? `${members.length} sample · not live`
                : `${members.length} member${members.length === 1 ? "" : "s"}`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AgencyTeamView
