import { useQuery, useMutation } from "@tanstack/react-query";
import { insertMenuItemSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
export default function MenuManagement() {
    const { toast } = useToast();
    const [editingItem, setEditingItem] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data: menuItems = [], isLoading } = useQuery({
        queryKey: [api.menu.list.path],
    });
    const createMutation = useMutation({
        mutationFn: async (data) => {
            const res = await apiRequest("POST", api.menu.create.path, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.menu.list.path] });
            toast({ title: "Success", description: "Menu item created successfully" });
            setIsDialogOpen(false);
            form.reset();
        },
    });
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await apiRequest("PUT", api.menu.update.path.replace(":id", id.toString()), data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.menu.list.path] });
            toast({ title: "Success", description: "Menu item updated successfully" });
            setIsDialogOpen(false);
            setEditingItem(null);
            form.reset();
        },
    });
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await apiRequest("DELETE", api.menu.delete.path.replace(":id", id.toString()));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.menu.list.path] });
            toast({ title: "Success", description: "Menu item deleted successfully" });
        },
    });
    const form = useForm({
        resolver: zodResolver(insertMenuItemSchema),
        defaultValues: editingItem || {
            name: "",
            description: "",
            price: 0,
            category: "main",
            available: true,
            stockLevel: 0,
            lowStockThreshold: 5,
        },
    });
    const onSubmit = (data) => {
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data });
        }
        else {
            createMutation.mutate(data);
        }
    };
    const handleEdit = (item) => {
        setEditingItem(item);
        form.reset(item);
        setIsDialogOpen(true);
    };
    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this item?")) {
            deleteMutation.mutate(id);
        }
    };
    if (isLoading) {
        return (<div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    return (<div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Menu Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
                setEditingItem(null);
                form.reset({
                    name: "",
                    description: "",
                    price: 0,
                    category: "main",
                    available: true,
                    stockLevel: 0,
                    lowStockThreshold: 5,
                });
            }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-item">
              <Plus className="mr-2 h-4 w-4"/> Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-item-name"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-item-description"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (<FormItem>
                        <FormLabel>Price (GH₵)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} data-testid="input-item-price"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>)}/>
                  <FormField control={form.control} name="category" render={({ field }) => (<FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-item-category">
                              <SelectValue placeholder="Select category"/>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="main">Main</SelectItem>
                            <SelectItem value="dessert">Dessert</SelectItem>
                            <SelectItem value="drink">Drink</SelectItem>
                            <SelectItem value="appetizer">Appetizer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>)}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="stockLevel" render={({ field }) => (<FormItem>
                        <FormLabel>Stock Level</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} data-testid="input-item-stock"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>)}/>
                  <FormField control={form.control} name="lowStockThreshold" render={({ field }) => (<FormItem>
                        <FormLabel>Low Stock Alert</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} data-testid="input-item-threshold"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>)}/>
                </div>
                <FormField control={form.control} name="available" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-item-available"/>
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Available for order</FormLabel>
                      </div>
                    </FormItem>)}/>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-item">
                  {(createMutation.isPending || updateMutation.isPending) && (<Loader2 className="mr-2 h-4 w-4 animate-spin"/>)}
                  {editingItem ? "Update Item" : "Create Item"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuItems.map((item) => (<TableRow key={item.id}>
                <TableCell className="font-medium" data-testid={`text-item-name-${item.id}`}>{item.name}</TableCell>
                <TableCell className="capitalize" data-testid={`text-item-category-${item.id}`}>{item.category}</TableCell>
                <TableCell data-testid={`text-item-price-${item.id}`}>GH₵{item.price}</TableCell>
                <TableCell data-testid={`text-item-stock-${item.id}`}>
                  <span className={item.stockLevel <= item.lowStockThreshold ? "text-destructive font-bold" : ""}>
                    {item.stockLevel}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {item.available ? "Available" : "Unavailable"}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(item)} data-testid={`button-edit-item-${item.id}`}>
                    <Pencil className="h-4 w-4"/>
                  </Button>
                  <Button variant="outline" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)} data-testid={`button-delete-item-${item.id}`}>
                    <Trash2 className="h-4 w-4"/>
                  </Button>
                </TableCell>
              </TableRow>))}
          </TableBody>
        </Table>
      </div>
    </div>);
}
//# sourceMappingURL=menu-management.jsx.map