import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
export function useRooms() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const roomsQuery = useQuery({
        queryKey: [api.rooms.list.path],
        queryFn: () => apiFetch(api.rooms.list.path),
    });
    const createRoomMutation = useMutation({
        mutationFn: async (data) => {
            return apiFetch(api.rooms.create.path, {
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
        mutationFn: async ({ id, data }) => {
            const url = buildUrl(api.rooms.update.path, { id });
            return apiFetch(url, {
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
        mutationFn: async (id) => {
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
//# sourceMappingURL=use-rooms.js.map