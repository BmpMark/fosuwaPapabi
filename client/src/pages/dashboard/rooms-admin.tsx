import { useAuth } from "@/hooks/use-auth";
import { useRooms } from "@/hooks/use-rooms";
import { Layout } from "@/components/layout";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit2 } from "lucide-react";

const roomSchema = z.object({
  number: z.string().min(1, "Room number is required"),
  type: z.enum(["executive", "standard", "apartment"]),
  price: z.coerce.number().min(0, "Price must be positive"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  isAvailable: z.boolean().default(true),
});

type RoomFormData = z.infer<typeof roomSchema>;

export default function RoomsAdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { rooms, createRoom, deleteRoom, updateRoom } = useRooms();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  if (
    !user ||
    (user.role !== "admin" && user.role !== "staff" && user.role !== "manager")
  ) {
    setLocation("/dashboard");
    return null;
  }

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: { isAvailable: true, type: "standard", capacity: 2 },
  });

  const onSubmit = async (data: RoomFormData) => {
    if (editingRoom) {
      await updateRoom.mutateAsync({ id: editingRoom.id, data });
    } else {
      await createRoom.mutateAsync(data);
    }
    form.reset();
    setIsFormOpen(false);
    setEditingRoom(null);
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    form.reset({
      number: room.number,
      type: room.type,
      price: room.price,
      capacity: room.capacity,
      description: room.description,
      isAvailable: room.isAvailable,
    });
    setIsFormOpen(true);
  };

  const roomTypes = [
    { value: "standard", label: "Standard" },
    { value: "executive", label: "Executive" },
    { value: "apartment", label: "Apartment" },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <DashboardSidebar />
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">
                Room Management
              </h1>
              <p className="text-muted-foreground">
                Add and manage hotel rooms
              </p>
            </div>
            <Button
              onClick={() => {
                form.reset();
                setIsFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Room
            </Button>
          </div>

          {isFormOpen && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingRoom ? "Edit Room" : "Add New Room"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 101" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Type</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roomTypes.map((type) => (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (cents)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="15000"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="isAvailable"
                        render={({ field }) => (
                          <FormItem className="flex items-end gap-4">
                            <div>
                              <FormLabel>Available</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Room details and amenities..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        disabled={
                          createRoom.isPending || (updateRoom as any).isPending
                        }
                      >
                        {editingRoom ? "Save Changes" : "Add Room"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsFormOpen(false);
                          form.reset();
                          setEditingRoom(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {rooms.map((room) => (
              <Card key={room.id} data-testid={`card-room-${room.id}`}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4 flex-wrap">
                        <h3 className="font-display text-xl font-bold">
                          Room {room.number}
                        </h3>
                        <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium capitalize">
                          {room.type}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${room.isAvailable ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}
                        >
                          {room.isAvailable ? "Available" : "Occupied"}
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        {room.description}
                      </p>
                      <div className="flex gap-6 text-sm">
                        <span>
                          <strong>Price:</strong> GH₵
                          {(room.price / 100).toFixed(2)}
                        </span>
                        <span>
                          <strong>Capacity:</strong> {room.capacity}{" "}
                          {room.capacity === 1 ? "guest" : "guests"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEdit(room)}
                        data-testid={`button-edit-room-${room.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteRoom.mutate(room.id)}
                        disabled={deleteRoom.isPending}
                        data-testid={`button-delete-room-${room.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
