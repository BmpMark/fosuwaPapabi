import { useAuth } from "@/hooks/use-auth";
import { useRestaurant } from "@/hooks/use-restaurant";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";

const menuItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  price: z.coerce.number().min(0, "Price must be positive"),
  category: z.enum(["starter", "main", "dessert", "drink"]),
  available: z.boolean().default(true),
  image: z.string().url("Image must be a valid URL").optional().or(z.literal("")),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

export default function MenuAdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { menu, createMenuItem } = useRestaurant();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    setLocation("/dashboard");
    return null;
  }

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: { available: true, category: "main" },
  });

  const onSubmit = async (data: MenuItemFormData) => {
    await createMenuItem.mutateAsync(data);
    form.reset();
    setIsFormOpen(false);
  };

  const categories = [
    { value: "starter", label: "Starter" },
    { value: "main", label: "Main Course" },
    { value: "dessert", label: "Dessert" },
    { value: "drink", label: "Drink" },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <DashboardSidebar />
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">Menu Management</h1>
              <p className="text-muted-foreground">Add and manage restaurant menu items</p>
            </div>
            <Button onClick={() => { form.reset(); setIsFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>

          {isFormOpen && (
            <Card>
              <CardHeader>
                <CardTitle>Add Menu Item</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl><Input placeholder="e.g., Grilled Salmon" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (cents)</FormLabel>
                          <FormControl><Input type="number" placeholder="2500" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="available" render={({ field }) => (
                        <FormItem className="flex items-end gap-4">
                          <div>
                            <FormLabel>Available</FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea placeholder="Item details and ingredients..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="image" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex gap-4">
                      <Button type="submit" disabled={createMenuItem.isPending}>
                        Add Item
                      </Button>
                      <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); form.reset(); }}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {menu.map((item) => (
              <Card key={item.id} data-testid={`card-menu-${item.id}`}>
                <CardContent className="pt-6">
                  <div className="flex gap-6 items-start">
                    {item.image && (
                      <div className="flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4 flex-wrap">
                        <h3 className="font-display text-xl font-bold">{item.name}</h3>
                        <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium capitalize">{item.category}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.available ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}>
                          {item.available ? "Available" : "Unavailable"}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{item.description}</p>
                      <p className="text-sm font-semibold">${(item.price / 100).toFixed(2)}</p>
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
