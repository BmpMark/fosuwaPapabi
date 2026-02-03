import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { OfflineCache, NetworkUtils } from "@/lib/offline-utils";
import { useOnline } from "@/hooks/use-online";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";
export function useRestaurant() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { isOnline } = useOnline();
    const menuQuery = useQuery({
        queryKey: [api.menu.list.path],
        queryFn: async () => {
            try {
                const data = await apiFetch(api.menu.list.path);
                await OfflineCache.cacheMenuItems(data);
                return data;
            }
            catch {
                const cached = await OfflineCache.getCachedMenuItems();
                if (cached)
                    return cached;
                throw new Error("Failed to fetch menu");
            }
        },
    });
    useEffect(() => {
        if (menuQuery.data && isOnline) {
            OfflineCache.cacheMenuItems(menuQuery.data);
        }
    }, [menuQuery.data, isOnline]);
    const ordersQuery = useQuery({
        queryKey: [api.orders.list.path],
        queryFn: () => apiFetch(api.orders.list.path),
    });
    const createOrderMutation = useMutation({
        mutationFn: async (data) => {
            if (NetworkUtils.isOnline()) {
                return apiFetch(api.orders.create.path, {
                    method: api.orders.create.method,
                    body: JSON.stringify(data),
                });
            }
            else {
                const offlineOrder = { ...data, timestamp: Date.now(), offline: true };
                await OfflineCache.storePendingOrder(offlineOrder);
                return { id: Date.now(), ...data.order, status: "pending", offline: true };
            }
        },
        onSuccess: (data) => {
            if (!data.offline) {
                queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
                toast({ title: "Order Placed", description: "Your order is being prepared." });
            }
        },
    });
    const updateOrderStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            const url = buildUrl(api.orders.updateStatus.path, { id });
            return apiFetch(url, {
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
        mutationFn: async (id) => {
            const url = buildUrl(api.menu.delete.path, { id });
            return apiFetch(url, { method: api.menu.delete.method });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.menu.list.path] });
            toast({ title: "Menu Item Deleted", description: "Item has been removed." });
        },
    });
    const updateMenuItemMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const url = buildUrl(api.menu.update.path, { id });
            return apiFetch(url, {
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
//# sourceMappingURL=use-restaurant.js.map