import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@shared/routes";
import { type Room, type Reservation, type Order, type MenuItem } from "@shared/schema";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

export default function ReportsPage() {
  const { data: rooms = [] } = useQuery<Room[]>({ queryKey: [api.rooms.list.path] });
  const { data: reservations = [] } = useQuery<Reservation[]>({ queryKey: [api.reservations.list.path] });
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: [api.orders.list.path] });
  const { data: menuItems = [] } = useQuery<MenuItem[]>({ queryKey: [api.menu.list.path] });

  // Calculate Occupancy
  const occupiedRooms = reservations.filter(r => r.status === "checked_in").length;
  const occupancyRate = rooms.length > 0 ? (occupiedRooms / rooms.length) * 100 : 0;
  
  const occupancyData = [
    { name: "Occupied", value: occupiedRooms },
    { name: "Available", value: rooms.length - occupiedRooms },
  ];

  // Calculate Revenue Breakdown
  const roomRevenue = reservations.reduce((acc, r) => acc + r.totalPrice, 0);
  const restaurantRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  
  const revenueData = [
    { name: "Rooms", value: roomRevenue / 100 },
    { name: "Restaurant", value: restaurantRevenue / 100 },
  ];

  // Restaurant Sales by Category
  const salesByCategory = menuItems.reduce((acc, item) => {
    const itemSales = orders.reduce((sum, order) => {
      // In a real app we'd need order items, for MVP we'll approximate or use status
      return sum + (order.status === "completed" ? order.totalAmount : 0);
    }, 0);
    acc[item.category] = (acc[item.category] || 0) + itemSales / 100;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(salesByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-display font-bold">Admin Reports & Analytics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Occupancy Rate</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={occupancyData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {occupancyData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-2 text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Revenue Mix</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Restaurant Sales</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} outerRadius={80} fill="#8884d8" dataKey="value" label>
                    {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Key Performance Indicators</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-2xl font-bold">${((roomRevenue + restaurantRevenue) / 100).toLocaleString()}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">ADR (Avg Daily Rate)</div>
                <div className="text-2xl font-bold">${(roomRevenue / (reservations.length || 1) / 100).toFixed(2)}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Active Orders</div>
                <div className="text-2xl font-bold">{orders.filter(o => o.status !== "completed").length}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Pending Check-ins</div>
                <div className="text-2xl font-bold">{reservations.filter(r => r.status === "confirmed").length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
