import { useAuth } from "@/hooks/use-auth";
import { useReservations } from "@/hooks/use-reservations";
import { Layout } from "@/components/layout";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function ReservationsPage() {
  const { user } = useAuth();
  const { reservations } = useReservations();
  const [, setLocation] = useLocation();

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
            <h1 className="font-display text-3xl font-bold mb-2">
              {isAdmin ? "All Reservations" : "My Reservations"}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? "View and manage all guest reservations" 
                : "View your room bookings and check-ins"}
            </p>
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
                              GH₵{(reservation.totalPrice / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="text-xs text-muted-foreground pt-2 border-t">
                            Guest ID: {reservation.userId}
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
