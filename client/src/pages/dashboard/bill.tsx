import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@shared/routes";
import { type Reservation, type Order } from "@shared/schema";

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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-display font-bold">Your Folio / Bill</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Room Charges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userReservations.map(r => (
                  <div key={r.id} className="flex justify-between border-b pb-2">
                    <span>Reservation #{r.id}</span>
                    <span className="font-semibold">GH₵{(r.totalPrice / 100).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Room Total</span>
                  <span>GH₵{(roomTotal / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Restaurant & Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userOrders.map(o => (
                  <div key={o.id} className="flex justify-between border-b pb-2">
                    <span>Order #{o.id} ({o.paymentMethod})</span>
                    <span className="font-semibold">GH₵{(o.totalAmount / 100).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Service Total</span>
                  <span>GH₵{(orderTotal / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Total Balance</h2>
            <div className="text-3xl font-bold">GH₵{((roomTotal + orderTotal) / 100).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
