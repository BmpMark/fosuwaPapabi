import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type MenuItem, type InsertMenuItem, type Order, type InsertOrder } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { OfflineCache, NetworkUtils } from "@/lib/offline-utils";
import { useOnline } from "@/hooks/use-online";
import { useEffect } from "react";

export function useRestaurant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isOnline } = useOnline();

  // Menu with offline caching
  const menuQuery = useQuery({
    queryKey: [api.menu.list.path],
    queryFn: async () => {
      try {
        // Try to fetch from network
        const res = await fetch(api.menu.list.path);
        if (!res.ok) throw new Error("Failed to fetch menu");

        const data = api.menu.list.responses[200].parse(await res.json());

        // Cache the data for offline use
        await OfflineCache.cacheMenuItems(data);

        return data;
      } catch (error) {
        // If network fails, try to get cached data
        console.log('Network failed, trying cached menu data');
        const cached = await OfflineCache.getCachedMenuItems();
        if (cached) {
          return cached;
        }
        throw error;
      }
    },
    // Enable background refetching when coming back online
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Cache menu data when it loads
  useEffect(() => {
    if (menuQuery.data && menuQuery.data.length > 0 && isOnline) {
      OfflineCache.cacheMenuItems(menuQuery.data);
    }
  }, [menuQuery.data, isOnline]);

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
      if (NetworkUtils.isOnline()) {
        // Online: Submit to server
        const res = await fetch(api.orders.create.path, {
          method: api.orders.create.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to place order");
        return api.orders.create.responses[201].parse(await res.json());
      } else {
        // Offline: Store for background sync
        const orderWithMeta = {
          ...data,
          timestamp: Date.now(),
          offline: true,
        };
        await OfflineCache.storePendingOrder(orderWithMeta);
        // Return a mock response for offline
        return { id: Date.now(), ...data.order, status: 'pending', offline: true };
      }
    },
    onSuccess: (data, variables) => {
      if (!data.offline) {
        // Only invalidate and show toast for online orders
        queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
        toast({ title: "Order Placed", description: "Your order is being prepared." });
      }
      // For offline orders, the success handling is done in the component
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

  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.menu.delete.path, { id });
      const res = await fetch(url, {
        method: api.menu.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete menu item");
      return api.menu.delete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.menu.list.path] });
      toast({ title: "Menu Item Deleted", description: "Item has been removed." });
    },
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMenuItem> }) => {
      const url = buildUrl(api.menu.update.path, { id });
      const res = await fetch(url, {
        method: api.menu.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update menu item");
      return api.menu.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.menu.list.path] });
      toast({ title: "Menu Item Updated", description: "Changes have been saved." });
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
    deleteMenuItem: deleteMenuItemMutation,
    updateMenuItem: updateMenuItemMutation,
  };
}
