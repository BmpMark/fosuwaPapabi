import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, RefreshCw } from "lucide-react";
import { OfflineCache, BackgroundSync } from "@/lib/offline-utils";
import { useOnline } from "@/hooks/use-online";

interface PendingOrder {
  id: string;
  timestamp: number;
  totalAmount: number;
  type: string;
  items: any[];
}

export function PendingOrdersIndicator() {
  const { isOnline } = useOnline();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load pending orders
  useEffect(() => {
    loadPendingOrders();
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingOrders.length > 0) {
      handleSync();
    }
  }, [isOnline, pendingOrders.length]);

  const loadPendingOrders = async () => {
    try {
      const orders = await OfflineCache.getPendingOrders();
      setPendingOrders(orders);
    } catch (error) {
      console.error('Failed to load pending orders:', error);
    }
  };

  const handleSync = async () => {
    if (!isOnline || pendingOrders.length === 0) return;

    setIsSyncing(true);
    try {
      await BackgroundSync.syncPendingData();
      await loadPendingOrders(); // Refresh the list
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (pendingOrders.length === 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Clock className="h-4 w-4" />
          Pending Orders ({pendingOrders.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-orange-700">
          These orders will be submitted when you're back online.
        </div>

        {pendingOrders.slice(0, 3).map((order) => (
          <div key={order.id} className="flex items-center justify-between p-2 bg-white rounded border">
            <div>
              <div className="font-medium">GH₵{order.totalAmount?.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {order.type} • {new Date(order.timestamp).toLocaleDateString()}
              </div>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              Pending
            </Badge>
          </div>
        ))}

        {pendingOrders.length > 3 && (
          <div className="text-xs text-muted-foreground text-center">
            +{pendingOrders.length - 3} more orders
          </div>
        )}

        <Button
          onClick={handleSync}
          disabled={!isOnline || isSyncing}
          size="sm"
          className="w-full"
          variant="outline"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-2" />
              Sync Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}