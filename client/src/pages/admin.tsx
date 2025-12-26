import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRoomSchema, insertMenuItemSchema, type Room, type MenuItem } from "@shared/schema";
import { api } from "@shared/routes";
import { Trash2, Edit2, Plus, Upload } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";

export default function AdminPage() {
  const { toast } = useToast();
  const { getUploadParameters } = useUpload();
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuImageUrl, setMenuImageUrl] = useState<string | undefined>();

  // Queries
  const { data: rooms = [] } = useQuery({
    queryKey: [api.rooms.list.path],
    queryFn: () => apiRequest("GET", api.rooms.list.path),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: [api.menu.list.path],
    queryFn: () => apiRequest("GET", api.menu.list.path),
  });

  // Room mutations
  const createRoomMutation = useMutation({
    mutationFn: (data: typeof insertRoomSchema._type) =>
      apiRequest("POST", api.rooms.create.path, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
      setRoomDialogOpen(false);
      roomForm.reset();
      toast({ title: "Room created successfully" });
    },
    onError: () => toast({ title: "Failed to create room", variant: "destructive" }),
  });

  const updateRoomMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<typeof insertRoomSchema._type> }) =>
      apiRequest("PUT", api.rooms.update.path.replace(":id", String(data.id)), data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
      setRoomDialogOpen(false);
      setEditingRoom(null);
      roomForm.reset();
      toast({ title: "Room updated successfully" });
    },
    onError: () => toast({ title: "Failed to update room", variant: "destructive" }),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", api.rooms.delete.path.replace(":id", String(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
      toast({ title: "Room deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete room", variant: "destructive" }),
  });

  // Menu item mutations
  const createMenuMutation = useMutation({
    mutationFn: (data: typeof insertMenuItemSchema._type) =>
      apiRequest("POST", api.menu.create.path, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.menu.list.path] });
      setMenuDialogOpen(false);
      menuForm.reset();
      toast({ title: "Menu item created successfully" });
    },
    onError: () => toast({ title: "Failed to create menu item", variant: "destructive" }),
  });

  const updateMenuMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<typeof insertMenuItemSchema._type> }) =>
      apiRequest("PUT", api.menu.update.path.replace(":id", String(data.id)), data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.menu.list.path] });
      setMenuDialogOpen(false);
      setEditingMenuItem(null);
      menuForm.reset();
      toast({ title: "Menu item updated successfully" });
    },
    onError: () => toast({ title: "Failed to update menu item", variant: "destructive" }),
  });

  const deleteMenuMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", api.menu.delete.path.replace(":id", String(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.menu.list.path] });
      toast({ title: "Menu item deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete menu item", variant: "destructive" }),
  });

  // Forms
  const roomForm = useForm({
    resolver: zodResolver(insertRoomSchema),
    defaultValues: editingRoom || {
      number: "",
      type: "single",
      price: 0,
      description: "",
      capacity: 1,
      isAvailable: true,
    },
  });

  const menuForm = useForm({
    resolver: zodResolver(insertMenuItemSchema),
    defaultValues: editingMenuItem || {
      name: "",
      description: "",
      price: 0,
      category: "main",
      available: true,
    },
  });

  const handleRoomSubmit = (data: typeof insertRoomSchema._type) => {
    if (editingRoom) {
      updateRoomMutation.mutate({ id: editingRoom.id, updates: data });
    } else {
      createRoomMutation.mutate(data);
    }
  };

  const handleMenuSubmit = (data: typeof insertMenuItemSchema._type) => {
    if (editingMenuItem) {
      updateMenuMutation.mutate({ id: editingMenuItem.id, updates: data });
    } else {
      createMenuMutation.mutate(data);
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    roomForm.reset(room);
    setRoomDialogOpen(true);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    menuForm.reset(item);
    setMenuDialogOpen(true);
  };

  const handleCloseRoomDialog = () => {
    setRoomDialogOpen(false);
    setEditingRoom(null);
    roomForm.reset();
  };

  const handleCloseMenuDialog = () => {
    setMenuDialogOpen(false);
    setEditingMenuItem(null);
    setMenuImageUrl(undefined);
    menuForm.reset();
  };

  const handleUploadSuccess = (response: any) => {
    const imageUrl = response.objectPath;
    setMenuImageUrl(imageUrl);
    menuForm.setValue("imageUrl", imageUrl);
    toast({ title: "Image uploaded successfully" });
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage rooms and menu items</p>
        </div>

        {/* Rooms Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Rooms</h2>
            <Dialog open={roomDialogOpen} onOpenChange={(open) => {
              if (!open) handleCloseRoomDialog();
              setRoomDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingRoom(null);
                  roomForm.reset();
                }} data-testid="button-add-room">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
                  <DialogDescription>
                    {editingRoom ? "Update room details" : "Create a new room in the system"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...roomForm}>
                  <form onSubmit={roomForm.handleSubmit(handleRoomSubmit)} className="space-y-4">
                    <FormField
                      control={roomForm.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 101" data-testid="input-room-number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={roomForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-room-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="double">Double</SelectItem>
                              <SelectItem value="suite">Suite</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={roomForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (cents)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="10000" data-testid="input-room-price" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={roomForm.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacity</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="2" data-testid="input-room-capacity" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={roomForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Room description" data-testid="textarea-room-description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" data-testid="button-submit-room" disabled={createRoomMutation.isPending || updateRoomMutation.isPending}>
                      {editingRoom ? "Update Room" : "Create Room"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Room List</CardTitle>
              <CardDescription>All rooms in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead data-testid="header-number">Number</TableHead>
                      <TableHead data-testid="header-type">Type</TableHead>
                      <TableHead data-testid="header-capacity">Capacity</TableHead>
                      <TableHead data-testid="header-price">Price</TableHead>
                      <TableHead data-testid="header-available">Available</TableHead>
                      <TableHead data-testid="header-actions">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id} data-testid={`row-room-${room.id}`}>
                        <TableCell data-testid={`cell-room-number-${room.id}`}>{room.number}</TableCell>
                        <TableCell data-testid={`cell-room-type-${room.id}`}>{room.type}</TableCell>
                        <TableCell data-testid={`cell-room-capacity-${room.id}`}>{room.capacity}</TableCell>
                        <TableCell data-testid={`cell-room-price-${room.id}`}>${(room.price / 100).toFixed(2)}</TableCell>
                        <TableCell data-testid={`cell-room-available-${room.id}`}>{room.isAvailable ? "Yes" : "No"}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRoom(room)}
                            data-testid={`button-edit-room-${room.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRoomMutation.mutate(room.id)}
                            data-testid={`button-delete-room-${room.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Menu Items</h2>
            <Dialog open={menuDialogOpen} onOpenChange={(open) => {
              if (!open) handleCloseMenuDialog();
              setMenuDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingMenuItem(null);
                  menuForm.reset();
                }} data-testid="button-add-menu-item">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingMenuItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
                  <DialogDescription>
                    {editingMenuItem ? "Update menu item details" : "Create a new menu item"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...menuForm}>
                  <form onSubmit={menuForm.handleSubmit(handleMenuSubmit)} className="space-y-4">
                    <FormField
                      control={menuForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Bruschetta" data-testid="input-menu-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={menuForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Item description" data-testid="textarea-menu-description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={menuForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-menu-category">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="starter">Starter</SelectItem>
                              <SelectItem value="main">Main</SelectItem>
                              <SelectItem value="dessert">Dessert</SelectItem>
                              <SelectItem value="drink">Drink</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={menuForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (cents)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="800" data-testid="input-menu-price" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={menuForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image</FormLabel>
                          <div className="space-y-2">
                            {(menuImageUrl || field.value) && (
                              <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted">
                                <img 
                                  src={menuImageUrl || field.value} 
                                  alt="Menu item" 
                                  className="w-full h-full object-cover"
                                  data-testid="preview-menu-image"
                                />
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={async (e) => {
                                e.preventDefault();
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = "image/*";
                                input.onchange = async (event) => {
                                  const file = (event.target as HTMLInputElement).files?.[0];
                                  if (file) {
                                    const response = await fetch("/api/uploads/request-url", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        name: file.name,
                                        size: file.size,
                                        contentType: file.type,
                                      }),
                                    });
                                    const data = await response.json();
                                    await fetch(data.uploadURL, {
                                      method: "PUT",
                                      body: file,
                                      headers: { "Content-Type": file.type },
                                    });
                                    handleUploadSuccess(data);
                                  }
                                };
                                input.click();
                              }}
                              data-testid="button-upload-menu-image"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {menuImageUrl || field.value ? "Change Image" : "Upload Image"}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" data-testid="button-submit-menu" disabled={createMenuMutation.isPending || updateMenuMutation.isPending}>
                      {editingMenuItem ? "Update Item" : "Create Item"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Menu Items List</CardTitle>
              <CardDescription>All menu items available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead data-testid="header-name">Name</TableHead>
                      <TableHead data-testid="header-category">Category</TableHead>
                      <TableHead data-testid="header-price">Price</TableHead>
                      <TableHead data-testid="header-available">Available</TableHead>
                      <TableHead data-testid="header-menu-actions">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menuItems.map((item) => (
                      <TableRow key={item.id} data-testid={`row-menu-${item.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="w-10 h-10 rounded object-cover"
                                data-testid={`img-menu-${item.id}`}
                              />
                            )}
                            <span data-testid={`cell-menu-name-${item.id}`}>{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`cell-menu-category-${item.id}`}>{item.category}</TableCell>
                        <TableCell data-testid={`cell-menu-price-${item.id}`}>${(item.price / 100).toFixed(2)}</TableCell>
                        <TableCell data-testid={`cell-menu-available-${item.id}`}>{item.available ? "Yes" : "No"}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditMenuItem(item)}
                            data-testid={`button-edit-menu-${item.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMenuMutation.mutate(item.id)}
                            data-testid={`button-delete-menu-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
