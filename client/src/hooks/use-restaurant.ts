import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { MenuItem, InsertMenuItem, Order, InsertOrder } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { OfflineCache, NetworkUtils } from "@/lib/offline-utils";
import { useOnline } from "@/hooks/use-online";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

export function useRestaurant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isOnline } = useOnline();

  const menuQuery = useQuery<MenuItem[]>({
    queryKey: [api.menu.list.path],
    queryFn: async () => {
      try {
        const data = await apiFetch<MenuItem[]>(api.menu.list.path);
        await OfflineCache.cacheMenuItems(data);
        return data;
      } catch {
        const cached = await OfflineCache.getCachedMenuItems();
        if (cached) return cached;
        throw new Error("Failed to fetch menu");
      }
    },
  });

  useEffect(() => {
    if (menuQuery.data && isOnline) {
      OfflineCache.cacheMenuItems(menuQuery.data);
    }
  }, [menuQuery.data, isOnline]);

  const ordersQuery = useQuery<Order[]>({
    queryKey: [api.orders.list.path],
    queryFn: () => apiFetch<Order[]>(api.orders.list.path),
  });

  const createMenuItemMutation = useMutation({
    mutationFn: async (data: InsertMenuItem) => {
      return apiFetch<MenuItem>(api.menu.create.path, {
        method: api.menu.create.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.menu.list.path] });
      toast({ title: "Menu Item Created", description: "Item added successfully." });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { order: InsertOrder; items: { menuItemId: number; quantity: number }[] }) => {
      if (NetworkUtils.isOnline()) {
        return apiFetch<Order>(api.orders.create.path, {
          method: api.orders.create.method,
          body: JSON.stringify(data),
        });
      } else {
        const offlineOrder = { ...data, timestamp: Date.now(), offline: true };
        await OfflineCache.storePendingOrder(offlineOrder);
        return { id: Date.now(), ...data.order, status: "pending", offline: true } as any;
      }
    },
    onSuccess: (data: any) => {
      if (!data.offline) {
        queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
        toast({ title: "Order Placed", description: "Your order is being prepared." });
      }
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const url = buildUrl(api.orders.updateStatus.path, { id });
      return apiFetch<Order>(url, {
        method: api.orders.updateStatus.method,
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      toast({ title: "Order Updated", description: "Order status has been changed." });
    },
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.menu.delete.path, { id });
      return apiFetch(url, { method: api.menu.delete.method });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.menu.list.path] });
      toast({ title: "Menu Item Deleted", description: "Item has been removed." });
    },
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMenuItem> }) => {
      const url = buildUrl(api.menu.update.path, { id });
      return apiFetch<MenuItem>(url, {
        method: api.menu.update.method,
        body: JSON.stringify(data),
      });
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
