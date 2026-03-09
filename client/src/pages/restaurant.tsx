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
import { OfflineCache, BackgroundSync, NetworkUtils } from "@/lib/offline-utils";

export default function RestaurantPage() {
  const { menu, isLoadingMenu, createOrder } = useRestaurant();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOnline();
  const [cart, setCart] = useState<{ id: number; quantity: number }[]>([]);
  const [orderType, setOrderType] = useState<"dine_in" | "take_away" | "room_service">("dine_in");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "room_folio">("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
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
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
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
        // Online: Submit directly to server
        await createOrder.mutateAsync({
          order: orderData,
          items: orderItems,
        });

        toast({
          title: "Order Placed",
          description: "Your order has been submitted successfully.",
        });
      } else {
        // Offline: Store for background sync
        await OfflineCache.storePendingOrder(orderData);

        // Register background sync
        await BackgroundSync.registerSync();

        toast({
          title: "Order Saved Offline",
          description: "Your order will be submitted when you're back online.",
        });
      }

      // Clear cart and reset form
      setCart([]);
      setOrderType("dine_in");

    } catch (error) {
      console.error('Order submission failed:', error);
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
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
    <Layout>
      <div className="bg-primary py-12 md:py-20 text-primary-foreground relative overflow-hidden">
        {/* luxury restaurant food plating */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://pixabay.com/get/g1c6cf4c02087bc6c3c594195d5527a8731998a28575480eef312df36f0b8e11d3dc3fc325aec363efa5b33c59c862079dc96e4372485704fc3819d0a458e2ea2_1280.jpg"
            className="w-full h-full object-cover"
            alt="Restaurant Background"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
            Fosua Special
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto font-light">
            A culinary experience curated with passion and local ingredients.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-12 relative z-20">
        <FoodSlideshow />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <Tabs defaultValue={categories[0]} className="w-full">
          <div className="flex justify-center mb-8 md:mb-12 overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="bg-muted h-auto p-1 rounded-full inline-flex">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="rounded-full px-4 md:px-8 py-2 md:py-3 text-sm md:text-base capitalize data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {categories.map((category) => (
            <TabsContent
              key={category}
              value={category}
              className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {menu
                .filter((item) => item.category === category)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 items-start group p-4 rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    {item.image && (
                      <div className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="space-y-1 flex-1">
                      <h3 className="font-display text-xl font-bold text-primary group-hover:text-accent transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-lg font-semibold tabular-nums text-foreground/80">
                          GH₵{item.price.toFixed(2)}
                        </div>
                        {user ? (
                          cart.find((c) => c.id === item.id) ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-4 text-center text-sm font-medium">
                                {cart.find((c) => c.id === item.id)?.quantity}
                              </span>
                              <Button
                                size="icon"
                                onClick={() => addToCart(item.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={() => addToCart(item.id)}>
                              Order
                            </Button>
                          )
                        ) : (
                          <Link href="/login">
                            <Button variant="outline">Sign in to Order</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </TabsContent>
          ))}
        </Tabs>

        {user && cart.length > 0 && (
          <div className="fixed bottom-6 right-6 z-40">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 shadow-lg">
                  {!isOnline && <WifiOff className="w-4 h-4" />}
                  <ShoppingBag className="w-5 h-5" />
                  <span>Order ({cart.length})</span>
                  <span>GH₵{total.toFixed(2)}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    Review Your Order
                    {!isOnline && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 gap-1">
                        <WifiOff className="h-3 w-3" />
                        Offline
                      </Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {cart.map((item) => {
                    const menuItem = menu.find((m) => m.id === item.id);
                    if (!menuItem) return null;
                    return (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {item.quantity}x {menuItem.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            GH₵{menuItem.price.toFixed(2)} each
                          </p>
                        </div>
                        <p className="font-semibold">
                          GH₵{(menuItem.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                  
                  <div className="border-t pt-4 space-y-3">
                    <Label className="text-base font-semibold">Order Type</Label>
                    <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dine_in" id="dine_in" />
                        <Label htmlFor="dine_in" className="font-normal cursor-pointer">
                          Dine In
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="take_away" id="take_away" />
                        <Label htmlFor="take_away" className="font-normal cursor-pointer">
                          Take Away
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="room_service" id="room_service" />
                        <Label htmlFor="room_service" className="font-normal cursor-pointer">
                          Room Service
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <Label className="text-base font-semibold">Payment Method</Label>
                    <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="font-normal cursor-pointer">
                          Cash / Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="room_folio" id="room_folio" />
                        <Label htmlFor="room_folio" className="font-normal cursor-pointer">
                          Charge to Room Folio
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="border-t pt-4 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>GH₵{total.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={submitOrder}
                    disabled={isSubmitting || createOrder.isPending}
                  >
                    {isSubmitting
                      ? "Saving Order..."
                      : isOnline
                        ? (createOrder.isPending ? "Placing Order..." : "Place Order")
                        : "Save for Later"
                    }
                  </Button>

                  {!isOnline && (
                    <div className="text-xs text-muted-foreground text-center mt-2">
                      <Wifi className="h-3 w-3 inline mr-1" />
                      Order will sync when you're back online
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setCart([])}
                  >
                    Clear Cart
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </Layout>
  );
}
