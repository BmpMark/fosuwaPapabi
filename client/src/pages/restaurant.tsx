import { Layout } from "@/components/layout";
import { useRestaurant } from "@/hooks/use-restaurant";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FoodSlideshow } from "@/components/food-slideshow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Minus, ShoppingBag, Wifi, WifiOff } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useOnline } from "@/hooks/use-online";
import { OfflineCache, BackgroundSync } from "@/lib/offline-utils";
import { PaymentModal } from "@/components/payment-modal";

export default function RestaurantPage() {
  const { menu, isLoadingMenu, createOrder } = useRestaurant();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOnline();

  const [cart, setCart] = useState<{ id: number; quantity: number }[]>([]);
  const [orderType, setOrderType] = useState<"dine_in" | "take_away" | "room_service">("dine_in");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "room_folio">("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Stripe modal state
  const [paymentModal, setPaymentModal] = useState<{
    id: number;
    amount: number;
  } | null>(null);

  if (isLoadingMenu) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-2xl font-display text-muted-foreground">
            Loading Menu...
          </div>
        </div>
      </Layout>
    );
  }

  const categories = Array.from(new Set(menu.map((item) => item.category)));

  const addToCart = (id: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const submitOrder = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);

    const orderItems = cart.map((item) => ({
      menuItemId: item.id,
      quantity: item.quantity,
    }));

    const totalAmount = cart.reduce((acc, cartItem) => {
      const menuItem = menu.find((m) => m.id === cartItem.id);
      return acc + (menuItem ? menuItem.price * cartItem.quantity : 0);
    }, 0);

    const orderData = {
      userId: user!.id,
      roomId: null,
      type: orderType,
      paymentMethod,
      totalAmount,
      status: "pending" as const,
      items: orderItems,
      timestamp: Date.now(),
      offline: !isOnline,
    };

    try {
      if (isOnline) {
        const newOrder = await createOrder.mutateAsync({
          order: orderData,
          items: orderItems,
        });

        // ✅ OPEN STRIPE MODAL
        setPaymentModal({
          id: newOrder.id,
          amount: totalAmount, // safer than relying on backend
        });

        toast({
          title: "Order Placed",
          description: "Proceed to payment.",
        });
      } else {
        await OfflineCache.storePendingOrder(orderData);
        await BackgroundSync.registerSync();

        toast({
          title: "Order Saved Offline",
          description: "Will sync when back online.",
        });
      }

      setCart([]);
      setOrderType("dine_in");
    } catch (error) {
      console.error("Order submission failed:", error);
      toast({
        title: "Order Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = cart.reduce((acc, cartItem) => {
    const menuItem = menu.find((m) => m.id === cartItem.id);
    return acc + (menuItem ? menuItem.price * cartItem.quantity : 0);
  }, 0);

  return (
    <>
      <Layout>
        {/* HERO */}
        <div className="bg-primary py-12 text-primary-foreground text-center">
          <h1 className="text-4xl font-bold">Fosua Special</h1>
          <p className="opacity-80">Delicious meals made with love.</p>
        </div>

        <div className="max-w-4xl mx-auto py-10">
          <FoodSlideshow />

          <Tabs defaultValue={categories[0]}>
            <TabsList className="flex justify-center">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category} value={category}>
                {menu
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <Card key={item.id} className="mb-4 p-4 flex justify-between">
                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                        <p>{item.description}</p>
                        <p>GH₵{item.price.toFixed(2)}</p>
                      </div>

                      {user && (
                        <div>
                          <Button onClick={() => addToCart(item.id)}>
                            Add
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* CART */}
        {user && cart.length > 0 && (
          <div className="fixed bottom-6 right-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <ShoppingBag /> GH₵{total.toFixed(2)}
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Review Order</DialogTitle>
                </DialogHeader>

                <Button onClick={submitOrder} disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Place Order"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </Layout>

      {/* ✅ STRIPE PAYMENT MODAL (FIXED POSITION) */}
      {paymentModal && (
        <PaymentModal
          open={true}
          onClose={() => setPaymentModal(null)}
          onSuccess={() => {
            setPaymentModal(null);
          }}
          type="order"
          itemId={paymentModal.id}
          amount={paymentModal.amount}
        />
      )}
    </>
  );
}