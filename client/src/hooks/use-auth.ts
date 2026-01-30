import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type User, type InsertUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 👉 Get current user
  const userQuery = useQuery<User | null>({
    queryKey: [api.auth.user.path],
    queryFn: async () => {
      try {
        return await apiFetch<User>(api.auth.user.path);
      } catch (err: any) {
        if (err?.message === "Unauthorized" || err?.status === 401) {
          return null;
        }
        throw err;
      }
    },
  });

  // 👉 Login
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return apiFetch<User>(api.auth.login.path, {
        method: api.auth.login.method,
        body: JSON.stringify(credentials),
      });
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.user.path], user);
      toast({ title: "Welcome back!", description: `Logged in as ${user.name}` });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error?.message || "Invalid credentials",
      });
    },
  });

  // 👉 Register
  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      return apiFetch<User>(api.auth.register.path, {
        method: api.auth.register.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Account created",
        description: "Please log in with your new account.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error?.message || "Could not create account",
      });
    },
  });

  // 👉 Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiFetch(api.auth.logout.path, {
        method: api.auth.logout.method,
      });
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.user.path], null);
      toast({ title: "Logged out", description: "See you soon!" });
    },
  });

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
  };
}
