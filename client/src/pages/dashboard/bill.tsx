import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@shared/routes";
import { type Reservation, type Order } from "@shared/schema";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function BillPage() {
  const { user } = useAuth();
  
  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: [api.reservations.list.path],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: [api.orders.list.path],
  });

  const userReservations = reservations.filter(r => r.userId === user?.id);
  const userOrders = orders.filter(o => o.userId === user?.id);
  
  const roomTotal = userReservations.reduce((acc, r) => acc + r.totalPrice, 0);
  const orderTotal = userOrders.reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        <DashboardSidebar />
        <div className="flex-1 space-y-8">
          <h1 className="text-3xl font-display font-bold">Your Folio / Bill</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Room Charges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userReservations.length === 0 && (
                    <p className="text-muted-foreground text-sm italic">No room charges found.</p>
                  )}
                  {userReservations.map(r => (
                    <div key={r.id} className="flex flex-col sm:flex-row justify-between border-b pb-2 gap-1">
                      <span className="text-sm">Reservation #{r.id}</span>
                      <span className="font-semibold text-sm">GH₵{(r.totalPrice).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span className="text-base">Room Total</span>
                    <span className="text-base">GH₵{(roomTotal).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Restaurant & Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userOrders.length === 0 && (
                    <p className="text-muted-foreground text-sm italic">No service charges found.</p>
                  )}
                  {userOrders.map(o => (
                    <div key={o.id} className="flex flex-col sm:flex-row justify-between border-b pb-2 gap-1">
                      <span className="text-sm">Order #{o.id} ({o.paymentMethod})</span>
                      <span className="font-semibold text-sm">GH₵{(o.totalAmount).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span className="text-base">Service Total</span>
                    <span className="text-base">GH₵{(orderTotal).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary text-primary-foreground w-full overflow-hidden">
            <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold">Total Balance</h2>
              <div className="text-2xl sm:text-3xl font-bold">GH₵{((roomTotal + orderTotal)).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
