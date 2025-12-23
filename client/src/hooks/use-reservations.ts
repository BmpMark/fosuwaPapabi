import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Reservation, type InsertReservation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useReservations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reservationsQuery = useQuery({
    queryKey: [api.reservations.list.path],
    queryFn: async () => {
      const res = await fetch(api.reservations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reservations");
      return api.reservations.list.responses[200].parse(await res.json());
    },
  });

  const createReservationMutation = useMutation({
    mutationFn: async (data: InsertReservation) => {
      const res = await fetch(api.reservations.create.path, {
        method: api.reservations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create reservation");
      return api.reservations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reservations.list.path] });
      toast({ title: "Booked!", description: "Your reservation is confirmed." });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const url = buildUrl(api.reservations.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.reservations.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.reservations.updateStatus.responses[200].parse(await res.json());
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
