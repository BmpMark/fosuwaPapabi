import { useOnline } from "@/hooks/use-online";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Wifi, WifiOff, RefreshCw, Download, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
export function OfflineIndicator({ variant = "badge", className }) {
    const { isOnline, isOffline, wasOffline, effectiveType, canInstallPWA, installPWA, syncData } = useOnline();
    const [showSyncSuccess, setShowSyncSuccess] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    // Handle sync when coming back online
    useEffect(() => {
        if (isOnline && wasOffline) {
            handleSync();
        }
    }, [isOnline, wasOffline]);
    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncData();
            setShowSyncSuccess(true);
            setTimeout(() => setShowSyncSuccess(false), 3000);
        }
        catch (error) {
            console.error("Sync failed:", error);
        }
        finally {
            setIsSyncing(false);
        }
    };
    const getConnectionQuality = () => {
        if (!isOnline)
            return null;
        switch (effectiveType) {
            case "slow-2g":
            case "2g":
                return { label: "Slow", color: "text-orange-600", bg: "bg-orange-100" };
            case "3g":
                return { label: "Good", color: "text-yellow-600", bg: "bg-yellow-100" };
            case "4g":
                return { label: "Fast", color: "text-green-600", bg: "bg-green-100" };
            default:
                return { label: "Online", color: "text-green-600", bg: "bg-green-100" };
        }
    };
    const connectionQuality = getConnectionQuality();
    if (variant === "banner") {
        if (isOnline && !wasOffline)
            return null;
        return (<Card className={cn("fixed top-0 left-0 right-0 z-50 border-l-4 rounded-none border-t-0 border-r-0 border-b-0", isOnline
                ? "border-green-500 bg-green-50 text-green-800"
                : "border-orange-500 bg-orange-50 text-orange-800", className)}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (<CheckCircle className="h-5 w-5 text-green-600"/>) : (<WifiOff className="h-5 w-5 text-orange-600"/>)}
            <div>
              <p className="font-medium">
                {isOnline ? "Back Online" : "You're Offline"}
              </p>
              <p className="text-sm opacity-90">
                {isOnline
                ? "Your data has been synced successfully"
                : "Some features may be limited"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOnline && showSyncSuccess && (<Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1"/>
                Synced
              </Badge>)}

            {isOnline && !showSyncSuccess && (<Button size="sm" variant="outline" onClick={handleSync} disabled={isSyncing} className="border-green-200 hover:bg-green-100">
                {isSyncing ? (<RefreshCw className="h-3 w-3 mr-1 animate-spin"/>) : (<RefreshCw className="h-3 w-3 mr-1"/>)}
                Sync
              </Button>)}

            {canInstallPWA && (<Button size="sm" variant="outline" onClick={installPWA} className="border-green-200 hover:bg-green-100">
                <Download className="h-3 w-3 mr-1"/>
                Install App
              </Button>)}
          </div>
        </div>
      </Card>);
    }
    if (variant === "toast") {
        if (isOnline && !showSyncSuccess)
            return null;
        return (<div className={cn("fixed bottom-4 right-4 z-50 max-w-sm", className)}>
        <Card className={cn("p-4 shadow-lg border-l-4", isOnline
                ? "border-green-500 bg-green-50 text-green-800"
                : "border-orange-500 bg-orange-50 text-orange-800")}>
          <div className="flex items-start gap-3">
            {showSyncSuccess ? (<CheckCircle className="h-5 w-5 text-green-600 mt-0.5"/>) : isOnline ? (<Wifi className="h-5 w-5 text-green-600 mt-0.5"/>) : (<WifiOff className="h-5 w-5 text-orange-600 mt-0.5"/>)}

            <div className="flex-1">
              <p className="font-medium">
                {showSyncSuccess ? "Data Synced" : isOnline ? "Back Online" : "Connection Lost"}
              </p>
              <p className="text-sm opacity-90">
                {showSyncSuccess
                ? "Your offline changes have been synced"
                : isOnline
                    ? "You're back online and connected"
                    : "Working in offline mode"}
              </p>
            </div>
          </div>
        </Card>
      </div>);
    }
    // Default badge variant
    return (<div className={cn("flex items-center gap-2", className)}>
      {isOnline ? (<>
          <Badge variant="secondary" className={cn("gap-1", connectionQuality?.bg, connectionQuality?.color)}>
            <Wifi className="h-3 w-3"/>
            {connectionQuality?.label}
          </Badge>
          {showSyncSuccess && (<Badge variant="secondary" className="bg-green-100 text-green-800 gap-1">
              <CheckCircle className="h-3 w-3"/>
              Synced
            </Badge>)}
        </>) : (<Badge variant="secondary" className="bg-orange-100 text-orange-800 gap-1">
          <WifiOff className="h-3 w-3"/>
          Offline
        </Badge>)}

      {canInstallPWA && (<Button size="sm" variant="outline" onClick={installPWA} className="h-6 px-2 text-xs">
          <Download className="h-3 w-3 mr-1"/>
          Install
        </Button>)}
    </div>);
}
//# sourceMappingURL=offline-indicator.jsx.map