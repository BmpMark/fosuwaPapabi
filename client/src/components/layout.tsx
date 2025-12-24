import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
  ShoppingBag,
  CalendarCheck,
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

export function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
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
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-display font-bold text-xl group-hover:scale-110 transition-transform">
                F
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-primary">
                FOSUA PAPABI
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
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

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
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
                <Button
                  variant="default"
                  className="rounded-full px-6 font-semibold"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="space-y-1 px-4 py-6">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-foreground hover:bg-muted rounded-lg cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </div>
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/dashboard">
                  <div
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-primary hover:bg-muted rounded-lg cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                  </div>
                </Link>
                <div
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
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
                <div
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-primary hover:bg-muted rounded-lg cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Sign In
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <h3 className="font-display text-2xl font-bold">FOSUA PAPABI</h3>
          <p className="text-primary-foreground/70 leading-relaxed">
            Experience luxury and comfort in the heart of the city. A hotel
            designed for memories.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">
            Contact
          </h4>
          <ul className="space-y-2 text-primary-foreground/70">
            <li>Kwafokrom, off Nsawam-Accra road</li>
            <li>+233 54845 7017</li>
            <li>stay@fosua.com</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">
            Links
          </h4>
          <ul className="space-y-2 text-primary-foreground/70">
            <li>
              <Link href="/rooms" className="hover:text-white transition">
                Rooms & Suites
              </Link>
            </li>
            <li>
              <Link href="/restaurant" className="hover:text-white transition">
                Dining
              </Link>
            </li>
            <li>
              <Link href="/events" className="hover:text-white transition">
                Events
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">
            Social
          </h4>
          <ul className="space-y-2 text-primary-foreground/70">
            <li>Instagram</li>
            <li>Twitter</li>
            <li>Facebook</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-primary-foreground/10 text-center text-primary-foreground/50 text-sm">
        © 2025 FOSUA PAPABI Hotel. All rights reserved.
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      <main className="flex-grow fade-in">{children}</main>
      <Footer />
    </div>
  );
}
