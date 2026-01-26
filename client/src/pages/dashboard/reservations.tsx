import { useAuth } from "@/hooks/use-auth";
import { useReservations } from "@/hooks/use-reservations";
import { useOnline } from "@/hooks/use-online";
import { Layout } from "@/components/layout";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfflineIndicator } from "@/components/offline-indicator";
import { DataFreshnessIndicator } from "@/components/data-freshness-indicator";
import { useLocation } from "wouter";
import { CloudOff, Save, AlertCircle } from "lucide-react";
import React from "react";

export default function ReservationsPage() {
  const { user } = useAuth();
  const { reservations, isLoading } = useReservations();
  const { isOnline, wasOffline } = useOnline();
  const [, setLocation] = useLocation();

  // Track data freshness
  const [dataTimestamp, setDataTimestamp] = React.useState<number | undefined>();

  // Update timestamp when data loads
  React.useEffect(() => {
    if (reservations && reservations.length >= 0 && !isLoading) {
      setDataTimestamp(Date.now());
    }
  }, [reservations, isLoading]);

  if (!user) return null;

  const isAdmin = user.role === "staff" || user.role === "manager";

  // Show all reservations for admin, only user's reservations for guests
  const displayedReservations = isAdmin 
    ? reservations 
    : reservations.filter(r => r.userId === user.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "checked_in":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "checked_out":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <DashboardSidebar />
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-display text-3xl font-bold mb-2">
                  {isAdmin ? "All Reservations" : "My Reservations"}
                </h1>
                <p className="text-muted-foreground">
                  {isAdmin
                    ? "View and manage all guest reservations"
                    : "View your room bookings and check-ins"}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-2">
                  <OfflineIndicator variant="badge" />
                  <DataFreshnessIndicator timestamp={dataTimestamp} isOffline={!isOnline && wasOffline} />
                </div>
              </div>
            </div>

            {!isOnline && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CloudOff className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                        You're Currently Offline
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                        You can still view your cached reservations. Any changes will be synced when you're back online.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                        <AlertCircle className="h-3 w-3" />
                        Showing cached data from your last sync
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isOnline && wasOffline && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Save className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                        Back Online - Data Synced
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your reservations have been synchronized with the latest updates.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {displayedReservations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center py-8">
                  {isAdmin ? "No reservations yet." : "You haven't booked any rooms yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {displayedReservations.map((reservation) => (
                <Card key={reservation.id} data-testid={`card-reservation-${reservation.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-4">
                          <h3 className="font-display text-xl font-bold">
                            Room {reservation.roomId}
                          </h3>
                          <Badge className={getStatusColor(reservation.status)}>
                            {reservation.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wider">
                              Check-in
                            </p>
                            <p className="font-semibold">
                              {new Date(reservation.checkIn).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wider">
                              Check-out
                            </p>
                            <p className="font-semibold">
                              {new Date(reservation.checkOut).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wider">
                              Total Price
                            </p>
                            <p className="font-semibold">
                              GH₵{(reservation.totalPrice).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
                            <div>Guest: <span className="font-medium text-foreground">{(reservation as any).guestName || `ID: ${reservation.userId}`}</span></div>
                            {(reservation as any).guestPhone && (
                              <div>Phone: <span className="font-medium text-foreground">{(reservation as any).guestPhone}</span></div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
