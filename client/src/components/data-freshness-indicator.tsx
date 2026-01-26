import { Badge } from "@/components/ui/badge";
import { Clock, Wifi, WifiOff } from "lucide-react";
import { DataFreshness } from "@/lib/offline-utils";
import { useOnline } from "@/hooks/use-online";

interface DataFreshnessIndicatorProps {
  timestamp?: number;
  isOffline?: boolean;
  className?: string;
}

export function DataFreshnessIndicator({
  timestamp,
  isOffline,
  className
}: DataFreshnessIndicatorProps) {
  const { isOnline } = useOnline();

  if (!timestamp && !isOffline) return null;

  // If explicitly marked as offline data
  if (isOffline) {
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800 gap-1">
        <WifiOff className="h-3 w-3" />
        Offline Data
      </Badge>
    );
  }

  // If no timestamp, assume fresh
  if (!timestamp) return null;

  const age = Date.now() - timestamp;
  const isFresh = DataFreshness.isDataFresh(timestamp, 24 * 60 * 60 * 1000); // 24 hours

  if (isFresh && isOnline) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 gap-1">
        <Wifi className="h-3 w-3" />
        Live
      </Badge>
    );
  }

  // Show cached data indicator
  return (
    <Badge variant="secondary" className="bg-blue-100 text-blue-800 gap-1">
      <Clock className="h-3 w-3" />
      {DataFreshness.getDataAge(timestamp)}
    </Badge>
  );
}