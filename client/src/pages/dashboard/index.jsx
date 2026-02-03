import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useReservations } from "@/hooks/use-reservations";
import { useRestaurant } from "@/hooks/use-restaurant";
import { Calendar, DollarSign, Utensils, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
export default function Dashboard() {
    const { user } = useAuth();
    if (!user)
        return null;
    return (<Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 flex flex-col md:flex-row gap-6 md:gap-8">
        <DashboardSidebar />
        <div className="flex-1 space-y-6 md:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold mb-1 md:mb-2">Welcome back, {user.name}</h1>
              <p className="text-sm md:text-base text-muted-foreground">Here's what's happening today.</p>
            </div>
            {(user.role === "admin" || user.role === "staff") && (<Link href="/dashboard/reports">
                <Button className="gap-2 w-full sm:w-auto">
                  <BarChart3 className="h-4 w-4"/>
                  View Reports
                </Button>
              </Link>)}
          </div>

          {user.role === "admin" || user.role === "staff" ? <AdminStats /> : <GuestStats />}
        </div>
      </div>
    </Layout>);
}
function AdminStats() {
    const { reservations } = useReservations();
    const { orders } = useRestaurant();
    const totalRevenue = reservations.reduce((acc, curr) => acc + curr.totalPrice, 0) +
        orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const activeReservations = reservations.filter(r => r.status === "confirmed" || r.status === "checked_in");
    const pendingOrders = orders.filter(o => o.status === "pending");
    return (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <StatCard title="Total Revenue" value={`GH₵${(totalRevenue).toLocaleString()}`} icon={DollarSign} desc="Combined from rooms & dining"/>
      <StatCard title="Active Stays" value={activeReservations.length.toString()} icon={Users} desc="Currently checked in or booked"/>
      <StatCard title="Pending Orders" value={pendingOrders.length.toString()} icon={Utensils} desc="Kitchen orders needing attention" alert={pendingOrders.length > 0}/>
    </div>);
}
function GuestStats() {
    const { user } = useAuth();
    const { reservations } = useReservations();
    const myReservations = reservations.filter(r => r.userId === user?.id && r.status !== "cancelled");
    const upcoming = myReservations.filter(r => new Date(r.checkIn) >= new Date());
    return (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
      <StatCard title="Upcoming Stays" value={upcoming.length.toString()} icon={Calendar} desc="Get ready for your trip"/>
      <Card className="bg-primary text-primary-foreground border-none">
        <CardHeader>
          <CardTitle className="font-display">Need anything?</CardTitle>
          <CardDescription className="text-primary-foreground/70">Order room service directly to your room.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl md:text-4xl font-bold opacity-20">24/7</div>
        </CardContent>
      </Card>
    </div>);
}
function StatCard({ title, value, icon: Icon, desc, alert }) {
    return (<Card className={alert ? "border-destructive/50 bg-destructive/5" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 text-muted-foreground ${alert ? "text-destructive" : ""}`}/>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {desc}
        </p>
      </CardContent>
    </Card>);
}
//# sourceMappingURL=index.jsx.map