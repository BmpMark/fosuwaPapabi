import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRooms } from "@/hooks/use-rooms";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Sparkles, Wind, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface HousekeepingTask {
  id: number;
  roomId: number;
  status: string;
  assignedTo: number | null;
  notes: string | null;
  scheduledFor: string | null;
  updatedAt: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; badgeClass: string; Icon: any }
> = {
  clean: {
    label: "Clean",
    color: "border-l-green-500",
    badgeClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Icon: CheckCircle2,
  },
  inspected: {
    label: "Inspected",
    color: "border-l-purple-500",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Icon: Sparkles,
  },
  in_progress: {
    label: "In Progress",
    color: "border-l-blue-500",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Icon: Wind,
  },
  dirty: {
    label: "Needs Cleaning",
    color: "border-l-red-500",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    Icon: AlertCircle,
  },
};

export default function HousekeepingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { rooms } = useRooms();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<{ roomId: number; roomNumber: string } | null>(null);
  const [newStatus, setNewStatus] = useState("clean");
  const [newNotes, setNewNotes] = useState("");

  if (!user || !["staff", "manager", "admin"].includes(user.role)) {
    setLocation("/dashboard");
    return null;
  }

  const { data: tasks = [], isLoading } = useQuery<HousekeepingTask[]>({
    queryKey: ["/api/housekeeping"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/housekeeping");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const updateTask = useMutation({
    mutationFn: async ({
      roomId,
      status,
      notes,
    }: {
      roomId: number;
      status: string;
      notes: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/housekeeping/${roomId}`, {
        status,
        notes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/housekeeping"] });
      toast({ title: "Status Updated", description: "Housekeeping record saved." });
      setSelected(null);
      setNewNotes("");
    },
    onError: () =>
      toast({ variant: "destructive", title: "Update Failed", description: "Please try again." }),
  });

  // Merge rooms with their tasks so every room appears even without a task
  const roomsWithStatus = rooms.map((room) => {
    const task = tasks.find((t) => t.roomId === room.id);
    return {
      room,
      task,
      status: task?.status ?? "clean",
    };
  });

  // Sort: dirty first, then in_progress, then clean, then inspected
  const sortOrder: Record<string, number> = {
    dirty: 0,
    in_progress: 1,
    clean: 2,
    inspected: 3,
  };
  roomsWithStatus.sort(
    (a, b) => (sortOrder[a.status] ?? 9) - (sortOrder[b.status] ?? 9)
  );

  const counts = {
    dirty: roomsWithStatus.filter((r) => r.status === "dirty").length,
    in_progress: roomsWithStatus.filter((r) => r.status === "in_progress").length,
    clean: roomsWithStatus.filter((r) => r.status === "clean").length,
    inspected: roomsWithStatus.filter((r) => r.status === "inspected").length,
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <DashboardSidebar />
        <div className="flex-1 space-y-8">

          {/* Header */}
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Housekeeping</h1>
            <p className="text-muted-foreground">
              Track and manage room cleaning status across all rooms
            </p>
          </div>

          {/* Summary badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <Card key={key} className={`border-l-4 ${cfg.color}`}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2">
                    <cfg.Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{cfg.label}</span>
                  </div>
                  <p className="text-3xl font-bold mt-1">
                    {counts[key as keyof typeof counts]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Room grid */}
          {isLoading ? (
            <p className="text-muted-foreground">Loading rooms...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomsWithStatus.map(({ room, task, status }) => {
                const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.clean;
                return (
                  <Card
                    key={room.id}
                    data-testid={`card-housekeeping-${room.id}`}
                    className={`border-l-4 ${cfg.color} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => {
                      setSelected({ roomId: room.id, roomNumber: room.number });
                      setNewStatus(status);
                      setNewNotes(task?.notes ?? "");
                    }}
                  >
                    <CardContent className="pt-5 pb-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground">
                            Room {room.number}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {room.type}
                          </p>
                        </div>
                        <Badge className={cfg.badgeClass}>{cfg.label}</Badge>
                      </div>

                      {task?.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2 italic">
                          "{task.notes}"
                        </p>
                      )}

                      {task?.updatedAt && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                          <Clock className="h-3 w-3" />
                          Updated{" "}
                          {formatDistanceToNow(new Date(task.updatedAt), {
                            addSuffix: true,
                          })}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        {status !== "in_progress" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTask.mutate({ roomId: room.id, status: "in_progress", notes: "" });
                            }}
                            disabled={updateTask.isPending}
                          >
                            Start Cleaning
                          </Button>
                        )}
                        {status === "in_progress" && (
                          <Button
                            size="sm"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTask.mutate({ roomId: room.id, status: "clean", notes: "" });
                            }}
                            disabled={updateTask.isPending}
                          >
                            Mark Clean
                          </Button>
                        )}
                        {status === "clean" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTask.mutate({ roomId: room.id, status: "inspected", notes: "" });
                            }}
                            disabled={updateTask.isPending}
                          >
                            Mark Inspected
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Room {selected?.roomNumber} — Housekeeping
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dirty">Needs Cleaning</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="inspected">Inspected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="e.g. Extra towels needed, minibar restocked..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              disabled={updateTask.isPending}
              onClick={() => {
                if (!selected) return;
                updateTask.mutate({
                  roomId: selected.roomId,
                  status: newStatus,
                  notes: newNotes,
                });
              }}
            >
              {updateTask.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}