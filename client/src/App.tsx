import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import React, { Suspense } from "react";

import HomePage from "@/pages/home";
import RoomsPage from "@/pages/rooms";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard/index";
import RoomService from "@/pages/dashboard/room-service";
import RoomsAdminPage from "@/pages/dashboard/rooms-admin";
import MenuManagementPage from "@/pages/dashboard/menu-management";
import ReservationsPage from "@/pages/dashboard/reservations";
import KitchenOrdersPage from "@/pages/dashboard/kitchen-orders";
import MaintenancePage from "@/pages/dashboard/maintenance";
import HousekeepingPage from "@/pages/dashboard/housekeeping";
import BillPage from "@/pages/dashboard/bill";
import ReportsPage from "@/pages/dashboard/reports";
import NotFound from "@/pages/not-found";
import OfflinePage from "@/pages/offline";

// Lazy load RestaurantPage
const RestaurantPage = React.lazy(() => import("@/pages/restaurant"));
import Loading from "@/components/Loading";

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return null;

  if (!user) {
    setLocation("/login");
    return null;
  }

  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return null;

  if (!user || (user.role !== "staff" && user.role !== "manager")) {
    setLocation("/dashboard");
    return null;
  }
  return <Component />;
}
function ManagerRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  if (isLoading) return null;
  if (!user || user.role !== "manager") {
    setLocation("/dashboard");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/rooms" component={RoomsPage} />
      
      {/* Wrap lazy-loaded RestaurantPage in Suspense */}
      <Route path="/restaurant">
        <Suspense fallback={<Loading />}>
          <RestaurantPage />
        </Suspense>
      </Route>

      <Route path="/login" component={AuthPage} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard">
        <PrivateRoute component={Dashboard} />
      </Route>
      <Route path="/dashboard/orders">
        <AdminRoute component={RoomService} />
      </Route>
      <Route path="/dashboard/rooms">
        <AdminRoute component={RoomsAdminPage} />
      </Route>
      <Route path="/dashboard/menu">
        <AdminRoute component={MenuManagementPage} />
      </Route>
      <Route path="/dashboard/reservations">
        <PrivateRoute component={ReservationsPage} />
      </Route>
      <Route path="/dashboard/kitchen">
        <AdminRoute component={KitchenOrdersPage} />
      </Route>
      <Route path="/dashboard/housekeeping">
        <AdminRoute component={HousekeepingPage} />
      </Route>
      <Route path="/dashboard/maintenance">
        <AdminRoute component={MaintenancePage} />
      </Route>
      <Route path="/dashboard/reports">
      <ManagerRoute component={ReportsPage} />
      </Route>
      <Route path="/dashboard/bill">
        <PrivateRoute component={BillPage} />
      </Route>

      {/* Offline Page */}
      <Route path="/offline" component={OfflinePage} />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
