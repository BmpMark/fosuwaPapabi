import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Room, type InsertRoom } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useRooms() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const roomsQuery = useQuery({
    queryKey: [api.rooms.list.path],
    queryFn: async () => {
      const res = await fetch(api.rooms.list.path);
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return api.rooms.list.responses[200].parse(await res.json());
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: InsertRoom) => {
      const res = await fetch(api.rooms.create.path, {
        method: api.rooms.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create room");
      return api.rooms.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
      toast({ title: "Room created", description: "New room added to inventory." });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertRoom> }) => {
      const url = buildUrl(api.rooms.update.path, { id });
      const res = await fetch(url, {
        method: api.rooms.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update room");
      return api.rooms.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
      toast({ title: "Room updated", description: "Room details saved successfully." });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.rooms.delete.path, { id });
      const res = await fetch(url, {
        method: api.rooms.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete room");
      return api.rooms.delete.responses[200].parse(await res.json());
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
