import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type MenuItem, type InsertMenuItem, type Order, type InsertOrder } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useRestaurant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Menu
  const menuQuery = useQuery({
    queryKey: [api.menu.list.path],
    queryFn: async () => {
      const res = await fetch(api.menu.list.path);
      if (!res.ok) throw new Error("Failed to fetch menu");
      return api.menu.list.responses[200].parse(await res.json());
    },
  });

  const createMenuItemMutation = useMutation({
    mutationFn: async (data: InsertMenuItem) => {
      const res = await fetch(api.menu.create.path, {
        method: api.menu.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create menu item");
      return api.menu.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.menu.list.path] });
      toast({ title: "Menu Item Added", description: "Item is now available." });
    },
  });

  // Orders
  const ordersQuery = useQuery({
    queryKey: [api.orders.list.path],
    queryFn: async () => {
      const res = await fetch(api.orders.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return api.orders.list.responses[200].parse(await res.json());
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { order: InsertOrder; items: { menuItemId: number; quantity: number }[] }) => {
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to place order");
      return api.orders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      toast({ title: "Order Placed", description: "Your order is being prepared." });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const url = buildUrl(api.orders.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.orders.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.orders.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      toast({ title: "Order Updated", description: "Order status has been changed." });
    },
  });

  return {
    menu: menuQuery.data ?? [],
    orders: ordersQuery.data ?? [],
    isLoadingMenu: menuQuery.isLoading,
    isLoadingOrders: ordersQuery.isLoading,
    createMenuItem: createMenuItemMutation,
    createOrder: createOrderMutation,
    updateOrderStatus: updateOrderStatusMutation,
  };
}
