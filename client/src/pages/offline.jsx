import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, WifiOff, RefreshCw, Home } from "lucide-react";
import { Link } from "wouter";
import { useOnline } from "@/hooks/use-online";
import { useEffect } from "react";
export default function OfflinePage() {
    const { isOnline } = useOnline();
    const handleRetry = () => {
        window.location.reload();
    };
    // Redirect back when coming online
    useEffect(() => {
        if (isOnline) {
            const redirectPath = sessionStorage.getItem('offline-redirect') || '/';
            sessionStorage.removeItem('offline-redirect');
            window.location.href = redirectPath;
        }
    }, [isOnline]);
    return (<Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <WifiOff className="h-16 w-16 text-muted-foreground"/>
                <div className="absolute -top-1 -right-1">
                  <Wifi className="h-6 w-6 text-destructive animate-pulse"/>
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-display">You're Offline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              It looks like you've lost your internet connection. Don't worry - you can still access some features of the Fosua Papabi Hotel app offline.
            </p>

            <div className="space-y-3 text-sm text-left bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold text-foreground">Available Offline:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  View your saved reservations
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Browse cached room information
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Access previously loaded menu items
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  View your account information
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full gap-2">
                <RefreshCw className="h-4 w-4"/>
                Try Again
              </Button>

              <Link href="/">
                <Button variant="outline" className="w-full gap-2">
                  <Home className="h-4 w-4"/>
                  Go to Home
                </Button>
              </Link>
            </div>

            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p>Your data will sync automatically when you're back online.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>);
}
//# sourceMappingURL=offline.jsx.map