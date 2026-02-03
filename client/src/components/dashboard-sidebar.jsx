import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Bed, Calendar, Utensils, Receipt, ClipboardList, BarChart3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
export function DashboardSidebar() {
    const [location] = useLocation();
    const { user, logout } = useAuth();
    if (!user)
        return null;
    const isAdmin = user.role === "admin" || user.role === "staff" || user.role === "manager";
    const guestLinks = [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/reservations", label: "My Reservations", icon: Calendar },
        { href: "/dashboard/orders", label: "Room Service", icon: Utensils },
        { href: "/dashboard/bill", label: "My Bills", icon: Receipt },
    ];
    const adminLinks = [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/rooms", label: "Rooms", icon: Bed },
        { href: "/dashboard/reservations", label: "Reservations", icon: Calendar },
        { href: "/dashboard/menu", label: "Menu Items", icon: ClipboardList },
        { href: "/dashboard/kitchen", label: "Kitchen Orders", icon: Utensils },
        { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    ];
    const links = isAdmin ? adminLinks : guestLinks;
    return (<>
      {/* Mobile Sidebar Trigger - Floating Action Button for Dashboard Navigation */}
      <div className="md:hidden fixed bottom-24 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg border-2 border-white">
              <LayoutDashboard className="h-6 w-6"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2">
            <div className="px-2 py-1.5 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isAdmin ? "Management Portal" : "Guest Portal"}
              </p>
            </div>
            {links.map((link) => (<DropdownMenuItem key={link.href} asChild>
                <Link href={link.href}>
                  <div className={cn("flex items-center gap-3 w-full cursor-pointer px-2 py-2 rounded-md transition-colors", location === link.href ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                    <link.icon className="h-4 w-4"/>
                    <span className="font-medium">{link.label}</span>
                  </div>
                </Link>
              </DropdownMenuItem>))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

        <div className="w-64 bg-card border-r border-border h-[calc(100vh-5rem)] sticky top-20 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Dashboard</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {isAdmin ? "Management Portal" : "Guest Portal"}
          </p>
        </div>
        
        <div className="flex-1 px-4 space-y-1">
          {links.map((link) => (<Link key={link.href} href={link.href}>
              <div className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer", location === link.href
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <link.icon className="h-4 w-4"/>
                {link.label}
              </div>
            </Link>))}
        </div>

        <div className="p-4 border-t border-border mt-auto">
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => logout.mutate()}>
            <LogOut className="mr-2 h-4 w-4"/>
            Log out
          </Button>
        </div>
      </div>
    </>);
}
//# sourceMappingURL=dashboard-sidebar.jsx.map