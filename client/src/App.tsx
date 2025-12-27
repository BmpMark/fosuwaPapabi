import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";

import HomePage from "@/pages/home";
import RoomsPage from "@/pages/rooms";
import RestaurantPage from "@/pages/restaurant";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard/index";
import RoomService from "@/pages/dashboard/room-service";
import NotFound from "@/pages/not-found";

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

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/rooms" component={RoomsPage} />
      <Route path="/restaurant" component={RestaurantPage} />
      <Route path="/login" component={AuthPage} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard">
        <PrivateRoute component={Dashboard} />
      </Route>
      <Route path="/dashboard/orders">
        <PrivateRoute component={RoomService} />
      </Route>
      
      {/* Placeholder for admin/other routes if needed later */}
      <Route path="/dashboard/:any*">
        <PrivateRoute component={Dashboard} />
      </Route>

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
