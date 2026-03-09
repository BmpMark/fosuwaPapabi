import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  Home,
  Bed,
  Coffee,
  User,
  LogOut,
  LayoutDashboard,
  Moon,
  Sun,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChatWidget } from "./chat-widget";
import { OfflineIndicator } from "./offline-indicator";

export function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/rooms", label: "Rooms", icon: Bed },
    { href: "/restaurant", label: "Restaurant", icon: Coffee },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-display font-bold text-xl group-hover:scale-110 transition-transform">
                F
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-primary">
                Fosua Papabi
              </span>
            </div>
          </Link>

          <div className="hidden md:block">
            <OfflineIndicator variant="badge" />
          </div>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  className={cn(
                    "cursor-pointer text-sm font-medium transition-colors hover:text-primary",
                    location === link.href
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {link.label}
                </div>
              </Link>
            ))}

            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <div className="flex items-center w-full cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout.mutate()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="default" className="rounded-full px-6 font-semibold">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} className="mr-2">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle className="text-left font-display text-2xl">Fosua Papabi</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {links.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 text-lg font-medium rounded-lg transition-colors cursor-pointer",
                          location === link.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <link.icon className="h-5 w-5" />
                        {link.label}
                      </div>
                    </Link>
                  ))}
                  <div className="border-t border-border my-2 pt-4">
                    {user ? (
                      <>
                        <Link href="/dashboard">
                          <div
                            className="flex items-center gap-3 px-4 py-3 text-lg font-medium text-primary hover:bg-muted rounded-lg cursor-pointer"
                            onClick={() => setIsOpen(false)}
                          >
                            <LayoutDashboard className="h-5 w-5" />
                            Dashboard
                          </div>
                        </Link>
                        <div
                          className="flex items-center gap-3 px-4 py-3 text-lg font-medium text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                          onClick={() => {
                            logout.mutate();
                            setIsOpen(false);
                          }}
                        >
                          <LogOut className="h-5 w-5" />
                          Log out
                        </div>
                      </>
                    ) : (
                      <Link href="/login">
                        <Button className="w-full justify-start gap-3" variant="outline" onClick={() => setIsOpen(false)}>
                          <User className="h-5 w-5" />
                          Sign In
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <h3 className="font-display text-2xl font-bold">Fosua Papabi</h3>
          <p className="text-primary-foreground/70 leading-relaxed">
            Experience luxury and comfort in the heart of the town. A unique
            hotel designed for memories.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">Contact</h4>
          <ul className="space-y-2 text-primary-foreground/70">
            <li>Kwafokrom, Nsawam-Kumasi road</li>
            <li>+233 54 845 7017</li>
            <li>+233 59 328 3934</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">Links</h4>
          <ul className="space-y-2 text-primary-foreground/70">
            <li><Link href="/rooms" className="hover:text-white transition">Rooms & Suites</Link></li>
            <li><Link href="/restaurant" className="hover:text-white transition">Dining</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">Social</h4>
          <ul className="space-y-2 text-primary-foreground/70">
            <li>Instagram</li>
            <li>Twitter</li>
            <li>Facebook</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-primary-foreground/10 text-center text-primary-foreground/50 text-sm">
        © 2026 Fosua Papabi Hotel. All rights reserved.
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <OfflineIndicator variant="banner" />
      <Navbar />
      <main className="flex-grow fade-in">{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
