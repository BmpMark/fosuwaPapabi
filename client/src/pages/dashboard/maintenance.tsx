import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Plus,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Filter,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MaintenanceRequest {
  id: number;
  roomId: number | null;
  reportedById: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  assignedTo: number | null;
  notes: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

// ─── Config maps ──────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  string,
  { label: string; borderClass: string; badgeClass: string }
> = {
  low: {
    label: "Low",
    borderClass: "border-l-gray-300 dark:border-l-gray-600",
    badgeClass:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  medium: {
    label: "Medium",
    borderClass: "border-l-yellow-400",
    badgeClass:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  high: {
    label: "High",
    borderClass: "border-l-orange-400",
    badgeClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  urgent: {
    label: "Urgent",
    borderClass: "border-l-red-500",
    badgeClass:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 font-bold",
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; Icon: any; badgeClass: string }
> = {
  open: {
    label: "Open",
    Icon: AlertTriangle,
    badgeClass:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  in_progress: {
    label: "In Progress",
    Icon: Loader2,
    badgeClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  resolved: {
    label: "Resolved",
    Icon: CheckCircle2,
    badgeClass:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(d: string | null): Date | null {
  if (!d) return null;
  const s = d.endsWith("Z") || d.includes("+") ? d : d + "Z";
  return new Date(s);
}

// ─── New Request Form ─────────────────────────────────────────────────────────

function NewRequestDialog({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [roomId, setRoomId] = useState("");

  const createRequest = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/maintenance", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Failed to submit request");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "The maintenance team has been notified.",
      });
      onCreated();
      setOpen(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setRoomId("");
    },
    onError: (err: any) =>
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: err.message ?? "Please try again.",
      }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-new-maintenance">
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Maintenance Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="maint-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="maint-title"
              placeholder="e.g. Air conditioning not working"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-maintenance-title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="maint-desc">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="maint-desc"
              placeholder="Describe the issue in detail so the team can prepare..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              data-testid="input-maintenance-description"
            />
          </div>

          {/* Room number */}
          <div className="space-y-2">
            <Label htmlFor="maint-room">
              Room Number{" "}
              <span className="text-muted-foreground text-xs font-normal">
                (leave blank for common areas)
              </span>
            </Label>
            <Input
              id="maint-room"
              placeholder="e.g. 101"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              data-testid="input-maintenance-room"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <RadioGroup
              value={priority}
              onValueChange={setPriority}
              className="grid grid-cols-2 gap-2"
            >
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                    priority === key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  )}
                  onClick={() => setPriority(key)}
                >
                  <RadioGroupItem value={key} id={`priority-${key}`} />
                  <Label
                    htmlFor={`priority-${key}`}
                    className="cursor-pointer font-normal"
                  >
                    {cfg.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button
            className="w-full"
            disabled={
              createRequest.isPending || !title.trim() || !description.trim()
            }
            onClick={() =>
              createRequest.mutate({
                title: title.trim(),
                description: description.trim(),
                priority,
                roomId: roomId.trim() ? Number(roomId.trim()) : null,
                status: "open",
              })
            }
            data-testid="button-submit-maintenance"
          >
            {createRequest.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Staff Update Dialog ──────────────────────────────────────────────────────

function UpdateRequestDialog({
  request,
  onClose,
  onUpdated,
}: {
  request: MaintenanceRequest;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState(request.status);
  const [notes, setNotes] = useState(request.notes ?? "");

  const updateRequest = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/maintenance/${request.id}`, data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request Updated", description: "Changes have been saved." });
      onUpdated();
      onClose();
    },
    onError: (err: any) =>
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message,
      }),
  });

  const priorityCfg =
    PRIORITY_CONFIG[request.priority] ?? PRIORITY_CONFIG.medium;
  const createdDate = parseDate(request.createdAt);

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Update Request #{request.id}</DialogTitle>
      </DialogHeader>

      <div className="space-y-5 pt-2">
        {/* Request summary */}
        <div className="rounded-lg bg-muted px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{request.title}</p>
            <Badge className={priorityCfg.badgeClass}>
              {priorityCfg.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {request.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            {request.roomId && <span>Room {request.roomId}</span>}
            {createdDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(createdDate, { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Update Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger data-testid="select-maintenance-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="update-notes">
            Progress / Resolution Notes{" "}
            <span className="text-muted-foreground text-xs font-normal">
              (optional)
            </span>
          </Label>
          <Textarea
            id="update-notes"
            placeholder="What was done? What is the current status?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            data-testid="input-maintenance-notes"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={updateRequest.isPending}
            onClick={() =>
              updateRequest.mutate({ status, notes: notes.trim() || null })
            }
            data-testid="button-save-maintenance"
          >
            {updateRequest.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Update"
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({
  request,
  isStaff,
  onClick,
}: {
  request: MaintenanceRequest;
  isStaff: boolean;
  onClick: () => void;
}) {
  const priorityCfg =
    PRIORITY_CONFIG[request.priority] ?? PRIORITY_CONFIG.medium;
  const statusCfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.open;
  const createdDate = parseDate(request.createdAt);
  const resolvedDate = parseDate(request.resolvedAt);

  return (
    <Card
      data-testid={`card-maintenance-${request.id}`}
      className={cn(
        "border-l-4 transition-shadow",
        priorityCfg.borderClass,
        isStaff && "cursor-pointer hover:shadow-md"
      )}
      onClick={isStaff ? onClick : undefined}
    >
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-foreground text-sm leading-snug">
                {request.title}
              </p>
              <Badge className={priorityCfg.badgeClass}>
                {priorityCfg.label}
              </Badge>
              <Badge className={statusCfg.badgeClass}>
                {statusCfg.label}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {request.description}
            </p>

            {/* Resolution notes */}
            {request.notes && (
              <p className="text-xs text-muted-foreground italic bg-muted/50 rounded px-2 py-1.5">
                Note: {request.notes}
              </p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground/70 flex-wrap pt-0.5">
              {request.roomId && (
                <span className="font-medium text-muted-foreground">
                  Room {request.roomId}
                </span>
              )}
              {createdDate && (
                <span
                  className="flex items-center gap-1"
                  title={format(createdDate, "PPpp")}
                >
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(createdDate, { addSuffix: true })}
                </span>
              )}
              {resolvedDate && (
                <span className="text-green-600 font-medium">
                  Resolved {format(resolvedDate, "MMM d, h:mm a")}
                </span>
              )}
            </div>
          </div>

          {/* Right: chevron for staff */}
          {isStaff && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const isStaff =
    !!user && ["staff", "manager", "admin"].includes(user.role);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<MaintenanceRequest | null>(null);

  if (!user) {
    setLocation("/login");
    return null;
  }

  // ── Data ────────────────────────────────────────────────────────────────────

  const { data: requests = [], isLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ["/api/maintenance"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/maintenance");
      if (!res.ok) throw new Error("Failed to load requests");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });

  // ── Derived ─────────────────────────────────────────────────────────────────

  const counts = {
    open: requests.filter((r) => r.status === "open").length,
    in_progress: requests.filter((r) => r.status === "in_progress").length,
    resolved: requests.filter((r) => r.status === "resolved").length,
  };

  const filtered =
    statusFilter === "all"
      ? requests
      : requests.filter((r) => r.status === statusFilter);

  // Sort: urgent first, then by created date descending
  const priorityOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const sorted = [...filtered].sort((a, b) => {
    const pDiff =
      (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
    if (pDiff !== 0) return pDiff;
    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <DashboardSidebar />

        <div className="flex-1 space-y-8">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">
                Maintenance Requests
              </h1>
              <p className="text-muted-foreground text-sm">
                {isStaff
                  ? "Manage all maintenance and repair requests across the hotel"
                  : "Report issues in your room or anywhere on the property"}
              </p>
            </div>
            <NewRequestDialog onCreated={invalidate} />
          </div>

          {/* ── Summary cards ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {(["open", "in_progress", "resolved"] as const).map((key) => {
              const cfg = STATUS_CONFIG[key];
              const isActive = statusFilter === key;
              return (
                <Card
                  key={key}
                  data-testid={`card-summary-${key}`}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isActive && "ring-2 ring-primary"
                  )}
                  onClick={() =>
                    setStatusFilter(isActive ? "all" : key)
                  }
                >
                  <CardContent className="pt-4 pb-3 flex items-center gap-3">
                    <cfg.Icon
                      className={cn(
                        "h-5 w-5",
                        key === "open"
                          ? "text-yellow-500"
                          : key === "in_progress"
                            ? "text-blue-500"
                            : "text-green-500"
                      )}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {cfg.label}
                      </p>
                      <p className="text-2xl font-bold">{counts[key]}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── Filter bar ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">Filter:</span>
            {(["all", "open", "in_progress", "resolved"] as const).map(
              (f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={statusFilter === f ? "default" : "outline"}
                  className="capitalize text-xs"
                  onClick={() => setStatusFilter(f)}
                  data-testid={`filter-${f}`}
                >
                  {f === "all"
                    ? `All (${requests.length})`
                    : STATUS_CONFIG[f]?.label ?? f}
                </Button>
              )
            )}
          </div>

          {/* ── Request list ────────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading requests...</span>
            </div>
          ) : sorted.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center py-12 text-muted-foreground gap-3">
                  <Wrench className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">
                    {statusFilter === "all"
                      ? "No maintenance requests yet"
                      : `No ${STATUS_CONFIG[statusFilter]?.label.toLowerCase()} requests`}
                  </p>
                  {!isStaff && (
                    <p className="text-xs text-muted-foreground">
                      Use the "New Request" button to report an issue
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sorted.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  isStaff={isStaff}
                  onClick={() => setSelectedRequest(request)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Staff update dialog ────────────────────────────────────────────── */}
      {isStaff && selectedRequest && (
        <Dialog
          open={!!selectedRequest}
          onOpenChange={() => setSelectedRequest(null)}
        >
          <UpdateRequestDialog
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onUpdated={invalidate}
          />
        </Dialog>
      )}
    </Layout>
  );
}