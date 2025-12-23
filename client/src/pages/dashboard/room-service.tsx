import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useRestaurant } from "@/hooks/use-restaurant";
import { useReservations } from "@/hooks/use-reservations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Plus, Minus, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RoomService() {
  const { menu, createOrder, isLoadingMenu } = useRestaurant();
  const { reservations } = useReservations();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [cart, setCart] = useState<{id: number; quantity: number}[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  if (!user) return null;

  // Filter reservations to find active ones where the user is checked in or confirmed
  // Ideally this would check dates, but for simplicity we'll just check status/user
  const myActiveReservations = reservations.filter(
    r => r.userId === user.id && (r.status === 'checked_in' || r.status === 'confirmed')
  );

  const addToCart = (id: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const submitOrder = () => {
    if (!selectedRoomId) {
      toast({ variant: "destructive", title: "Select a Room", description: "Please select which room to deliver to." });
      return;
    }

    const orderItems = cart.map(item => ({ menuItemId: item.id, quantity: item.quantity }));
    const totalAmount = cart.reduce((acc, cartItem) => {
      const menuItem = menu.find(m => m.id === cartItem.id);
      return acc + (menuItem ? menuItem.price * cartItem.quantity : 0);
    }, 0);

    createOrder.mutate({
      order: {
        userId: user.id,
        roomId: parseInt(selectedRoomId),
        type: "room_service",
        totalAmount,
        status: "pending"
      },
      items: orderItems
    }, {
      onSuccess: () => setCart([])
    });
  };

  const total = cart.reduce((acc, cartItem) => {
    const menuItem = menu.find(m => m.id === cartItem.id);
    return acc + (menuItem ? menuItem.price * cartItem.quantity : 0);
  }, 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <DashboardSidebar />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <h1 className="font-display text-3xl font-bold">Room Service Menu</h1>
            
            {isLoadingMenu ? (
              <div>Loading menu...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {menu.map(item => (
                  <Card key={item.id} className="flex flex-row items-center p-4 gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold font-display">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="font-semibold mt-1">${(item.price / 100).toFixed(2)}</p>
                    </div>
                    {cart.find(c => c.id === item.id) ? (
                      <div className="flex items-center gap-3">
                        <Button size="icon" variant="outline" onClick={() => removeFromCart(item.id)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-4 text-center">{cart.find(c => c.id === item.id)?.quantity}</span>
                        <Button size="icon" onClick={() => addToCart(item.id)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => addToCart(item.id)}>Add</Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" /> Your Order
                </h2>
                
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Your cart is empty.</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => {
                      const menuItem = menu.find(m => m.id === item.id);
                      if (!menuItem) return null;
                      return (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {menuItem.name}</span>
                          <span>${((menuItem.price * item.quantity) / 100).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div className="border-t pt-4 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${(total / 100).toFixed(2)}</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Deliver to Room</label>
                      <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {myActiveReservations.length > 0 ? (
                            myActiveReservations.map(r => (
                              <SelectItem key={r.id} value={r.roomId.toString()}>
                                Room {r.roomId} (Check-in: {new Date(r.checkIn).toLocaleDateString()})
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">No active bookings found</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full" onClick={submitOrder} disabled={createOrder.isPending || !selectedRoomId}>
                      {createOrder.isPending ? "Placing Order..." : "Place Order"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
