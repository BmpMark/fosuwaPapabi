import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Reservation, type InsertReservation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { OfflineCache } from "@/lib/offline-utils";
import { useOnline } from "@/hooks/use-online";
import { useEffect } from "react";
import { PaymentModal } from "@/components/payment-modal";
import { apiFetch } from "@/lib/api";

export function useReservations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isOnline } = useOnline();

  const reservationsQuery = useQuery<Reservation[]>({
    queryKey: [api.reservations.list.path],
    queryFn: async () => {
      try {
        const data = await apiFetch<Reservation[]>(api.reservations.list.path);
        await OfflineCache.cacheReservations(data);
        return data;
      } catch {
        const cached = await OfflineCache.getCachedReservations();
        if (cached) return cached;
        throw new Error("Failed to fetch reservations");
      }
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (reservationsQuery.data && isOnline) {
      OfflineCache.cacheReservations(reservationsQuery.data);
    }
  }, [reservationsQuery.data, isOnline]);

  const createReservationMutation = useMutation({
    mutationFn: async (data: InsertReservation) => {
      return apiFetch<Reservation>(api.reservations.create.path, {
        method: api.reservations.create.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reservations.list.path] });
      toast({ title: "Booked!", description: "Your reservation is confirmed." });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const url = buildUrl(api.reservations.updateStatus.path, { id });
      return apiFetch<Reservation>(url, {
        method: api.reservations.updateStatus.method,
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reservations.list.path] });
      toast({ title: "Status Updated", description: "Reservation status changed." });
    },
  });

  return {
    reservations: reservationsQuery.data ?? [],
    isLoading: reservationsQuery.isLoading,
    createReservation: createReservationMutation,
    updateStatus: updateStatusMutation,
  };
}
