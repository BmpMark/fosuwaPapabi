import { useAuth } from "@/hooks/use-auth";
import { useRestaurant } from "@/hooks/use-restaurant";
import { Layout } from "@/components/layout";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function KitchenOrdersPage() {
  const { user } = useAuth();
  const { orders, updateOrderStatus } = useRestaurant();
  const [, setLocation] = useLocation();

  const handleUpdateStatus = (id: number, status: string) => {
    updateOrderStatus.mutate({ id, status });
  };

  if (!user || (user.role !== "staff" && user.role !== "manager" && user.role !== "admin")) {
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

  // Show only pending, preparing, and ready orders in active section
  const activeStatuses = ["pending", "preparing", "ready"];
  const activeOrders = orders.filter(o => activeStatuses.includes(o.status)).sort((a, b) => {
    const statusOrder = { "pending": 0, "preparing": 1, "ready": 2 };
    return (statusOrder[a.status as keyof typeof statusOrder] ?? 99) - (statusOrder[b.status as keyof typeof statusOrder] ?? 99);
  });

  const completedOrders = orders.filter(o => !activeStatuses.includes(o.status));

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <DashboardSidebar />
        <div className="flex-1 space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Kitchen Orders</h1>
            <p className="text-muted-foreground">Manage and track all incoming orders</p>
          </div>

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
                  <Card key={order.id} data-testid={`card-order-${order.id}`} className="border-l-4 border-l-yellow-400">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                            <p className="text-sm text-muted-foreground">Type: {order.type.replace('_', ' ')}</p>
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
                          <p className="text-muted-foreground font-medium">Payment: {order.paymentMethod.replace('_', ' ')}</p>
                          <p className="text-muted-foreground">Total: ${(order.totalAmount / 100).toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {completedOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Completed & Other Orders</h2>
              <div className="grid gap-4">
                {completedOrders.slice(0, 10).map((order) => (
                  <Card key={order.id} data-testid={`card-order-completed-${order.id}`} className="opacity-75">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                            <p className="text-sm text-muted-foreground">Type: {order.type.replace('_', ' ')}</p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        
                        <div className="pt-2 border-t text-sm">
                          <p className="text-muted-foreground">Total: ${(order.totalAmount / 100).toFixed(2)}</p>
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
