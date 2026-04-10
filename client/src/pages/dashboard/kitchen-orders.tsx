import { useAuth } from "@/hooks/use-auth";
import { useRestaurant } from "@/hooks/use-restaurant";
import { Layout } from "@/components/layout";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Clock, RefreshCw } from "lucide-react";
import { PaymentModal } from "@/components/payment-modal";

// ─── UTC timestamp fix ───────────────────────────────────────────────────────
// PostgreSQL returns timestamps without the 'Z' suffix (e.g. "2024-01-01T10:00:00.000000").
// Without 'Z', JavaScript parses the string as LOCAL time instead of UTC,
// making "ordered 10 minutes ago" show as "ordered 8 hours ago" on UTC+8 machines.
// This helper always forces UTC interpretation.
function parseOrderDate(createdAt: Date | string): Date {
  if (createdAt instanceof Date) return createdAt;
  const hasTimezone = createdAt.endsWith("Z") || createdAt.includes("+");
  return new Date(hasTimezone ? createdAt : createdAt + "Z");
}

// ─── Order timer component ────────────────────────────────────────────────────
function OrderTimer({ createdAt }: { createdAt: Date | string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      try {
        const date = parseOrderDate(createdAt);
        if (isNaN(date.getTime())) {
          setElapsed("unknown time");
          return;
        }
        setElapsed(formatDistanceToNow(date, { addSuffix: true }));
      } catch {
        setElapsed("unknown time");
      }
    };
    update();
    const interval = setInterval(update, 10000); // refresh label every 10 s
    return () => clearInterval(interval);
  }, [createdAt]);

  const getUrgencyColor = () => {
    try {
      const date = parseOrderDate(createdAt);
      if (isNaN(date.getTime())) return "text-muted-foreground";
      const minutes = (Date.now() - date.getTime()) / 60000;
      if (minutes > 30) return "text-red-500 font-bold animate-pulse";
      if (minutes > 15) return "text-orange-500 font-semibold";
      return "text-muted-foreground";
    } catch {
      return "text-muted-foreground";
    }
  };

  // Show the real clock time so staff always have an anchor, e.g. "2:30 PM"
  const actualTime = (() => {
    try {
      const date = parseOrderDate(createdAt);
      return isNaN(date.getTime()) ? null : format(date, "h:mm a");
    } catch {
      return null;
    }
  })();

  return (
    <div className={`flex items-center gap-1.5 text-sm ${getUrgencyColor()}`}>
      <Clock className="h-4 w-4 shrink-0" />
      <span>
        {actualTime && (
          <span className="font-semibold">{actualTime} · </span>
        )}
        ordered {elapsed}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function KitchenOrdersPage() {
  const { user } = useAuth();
  const { orders, updateOrderStatus, isLoadingOrders } = useRestaurant();
  const [, setLocation] = useLocation();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Stamp the refresh time whenever the orders data changes
  useEffect(() => {
    if (orders.length >= 0) {
      setLastRefreshed(new Date());
    }
  }, [orders]);

  const handleUpdateStatus = (id: number, status: string) => {
    updateOrderStatus.mutate({ id, status });
  };

  if (
    !user ||
    (user.role !== "staff" && user.role !== "manager" && user.role !== "admin")
  ) {
    setLocation("/dashboard");
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "preparing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ready":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getUrgencyBorder = (createdAt: Date | string) => {
    try {
      const minutes = (Date.now() - parseOrderDate(createdAt).getTime()) / 60000;
      if (minutes > 30) return "border-l-red-500 shadow-md shadow-red-100 dark:shadow-red-900/20";
      if (minutes > 15) return "border-l-orange-400";
      return "border-l-yellow-400";
    } catch {
      return "border-l-yellow-400";
    }
  };

  const activeStatuses = ["pending", "preparing", "ready"];
  const statusOrder: Record<string, number> = { pending: 0, preparing: 1, ready: 2 };

  const activeOrders = orders
    .filter((o) => activeStatuses.includes(o.status))
    .sort(
      (a, b) =>
        (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
    );

  const completedOrders = orders.filter((o) => !activeStatuses.includes(o.status));

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <DashboardSidebar />
        <div className="flex-1 space-y-8">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">Kitchen Orders</h1>
              <p className="text-muted-foreground">Manage and track all incoming orders</p>
            </div>
            {/* Live refresh indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isLoadingOrders ? "bg-yellow-400 animate-pulse" : "bg-green-500"
                }`}
              />
              <RefreshCw className="h-3 w-3" />
              <span>
                Updated {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
                &nbsp;· auto-refreshes every 15 s
              </span>
            </div>
          </div>

          {/* Active orders */}
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              Active Orders
              {activeOrders.length > 0 && (
                <Badge variant="destructive">{activeOrders.length}</Badge>
              )}
            </h2>

            {activeOrders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">No active orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeOrders.map((order) => (
                  <Card
                    key={order.id}
                    data-testid={`card-order-${order.id}`}
                    className={`border-l-4 ${getUrgencyBorder(order.createdAt)}`}
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Order #{order.id}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">
                              Type: {order.type.replace(/_/g, " ")}
                            </p>
                            <OrderTimer createdAt={order.createdAt} />
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>

                        <div className="pt-4 border-t flex gap-2">
                          {order.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, "preparing")}
                              disabled={updateOrderStatus.isPending}
                            >
                              Start Preparing
                            </Button>
                          )}
                          {order.status === "preparing" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleUpdateStatus(order.id, "ready")}
                              disabled={updateOrderStatus.isPending}
                            >
                              Mark Ready
                            </Button>
                          )}
                          {order.status === "ready" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(order.id, "completed")}
                              disabled={updateOrderStatus.isPending}
                            >
                              Complete
                            </Button>
                          )}
                        </div>

                        <div className="pt-2 border-t text-sm">
                          <p className="text-muted-foreground font-medium capitalize">
                            Payment: {order.paymentMethod.replace(/_/g, " ")}
                          </p>
                          <p className="text-muted-foreground">
                            Total: GH₵{Number(order.totalAmount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Completed orders */}
          {completedOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Completed & Other Orders</h2>
              <div className="grid gap-4">
                {completedOrders.slice(0, 10).map((order) => (
                  <Card
                    key={order.id}
                    data-testid={`card-order-completed-${order.id}`}
                    className="opacity-75"
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Order #{order.id}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">
                              Type: {order.type.replace(/_/g, " ")}
                            </p>
                            {/* Completed orders: show real clock time, no relative label needed */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {(() => {
                                  try {
                                    return format(parseOrderDate(order.createdAt), "h:mm a, MMM d");
                                  } catch {
                                    return "–";
                                  }
                                })()}
                              </span>
                            </div>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>

                        <div className="pt-2 border-t text-sm">
                          <p className="text-muted-foreground">
                            Total: GH₵{Number(order.totalAmount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}