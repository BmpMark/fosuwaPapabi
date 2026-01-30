import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Room, type InsertRoom } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

export function useRooms() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const roomsQuery = useQuery<Room[]>({
    queryKey: [api.rooms.list.path],
    queryFn: () => apiFetch<Room[]>(api.rooms.list.path),
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: InsertRoom) => {
      return apiFetch<Room>(api.rooms.create.path, {
        method: api.rooms.create.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
      toast({ title: "Room created", description: "New room added to inventory." });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertRoom> }) => {
      const url = buildUrl(api.rooms.update.path, { id });
      return apiFetch<Room>(url, {
        method: api.rooms.update.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
      toast({ title: "Room updated", description: "Room details saved successfully." });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.rooms.delete.path, { id });
      return apiFetch(url, { method: api.rooms.delete.method });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
      toast({ title: "Room deleted", description: "Room has been removed." });
    },
  });

  return {
    rooms: roomsQuery.data ?? [],
    isLoading: roomsQuery.isLoading,
    createRoom: createRoomMutation,
    updateRoom: updateRoomMutation,
    deleteRoom: deleteRoomMutation,
  };
}
