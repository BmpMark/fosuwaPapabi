import { Layout } from "@/components/layout";
import { useRooms } from "@/hooks/use-rooms";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Users,
  Wifi,
  BedDouble,
  ArrowRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useReservations } from "@/hooks/use-reservations";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

import roomImgPath from "@assets/fosuapapabiroom_1767732411656.jpg";
import standardRoomImgPath from "@assets/standardroom_1767732987982.jpg";
import executiveRoomImgPath from "@assets/executive_1767733236402.jpg";

const bookingSchema = z.object({
  checkIn: z.string().min(1, "Check-in date required"),
  checkOut: z.string().min(1, "Check-out date required"),
});

export default function RoomsPage() {
  const { rooms, isLoading } = useRooms();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-2xl font-display text-muted-foreground">
            Loading Rooms...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-5xl font-bold text-primary mb-4">
            Our Rooms
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our selection of elegantly appointed rooms and
            apartments.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} user={user} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

function RoomCard({ room, user }: { room: any; user: any }) {
  const { createReservation, reservations } = useReservations();
  const [isOpen, setIsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const roomEvents = (reservations || [])
    .filter((r: any) => r.roomId === room.id && r.status !== "cancelled")
    .map((r: any) => ({
      title: r.status === "checked_in" ? "Occupied" : "Reserved",
      start: r.checkIn,
      end: r.checkOut,
      backgroundColor: r.status === "checked_in" ? "#ef4444" : "#f59e0b",
      borderColor: "transparent",
    }));

  // Hardcoded images for demo based on room type
  const getRoomImage = (type: string) => {
    if (type.toLowerCase().includes("standard")) return standardRoomImgPath;
    if (type.toLowerCase().includes("executive")) return executiveRoomImgPath;
    return roomImgPath; // default to the first one for apartment or others
  };

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
  });

  const onSubmit = (data: z.infer<typeof bookingSchema>) => {
    // Calculate simple days diff for price (naive implementation)
    const start = new Date(data.checkIn);
    const end = new Date(data.checkOut);
    const nights = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (nights <= 0) return;

    createReservation.mutate(
      {
        roomId: room.id,
        userId: user.id,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        totalPrice: room.price * nights,
        status: "confirmed",
      },
      {
        onSuccess: () => setIsOpen(false),
      },
    );
  };

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50 bg-card flex flex-col h-full">
      <div className="relative h-64 overflow-hidden">
        <img
          src={getRoomImage(room.type)}
          alt={room.type}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 right-4">
          <Badge className="bg-white/90 text-primary hover:bg-white backdrop-blur-sm text-sm py-1 px-3 shadow-sm">
            GH₵{room.price.toFixed(2)} / night
          </Badge>
        </div>
      </div>

      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider">
            {room.type}
          </Badge>
          <div className="flex items-center text-muted-foreground text-xs gap-2">
            <Users className="w-3 h-3" /> {room.capacity} Guests
          </div>
        </div>
        <CardTitle className="font-display text-2xl">
          {room.number} - {room.type}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
          {room.description}
        </p>
        <div className="mt-4 flex gap-3 text-muted-foreground/70">
          <Wifi className="w-4 h-4" />
          <BedDouble className="w-4 h-4" />
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-border/50 gap-2">
        <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Room {room.number} Availability</DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-white rounded-lg">
              <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={roomEvents}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "",
                }}
                height="auto"
              />
            </div>
          </DialogContent>
        </Dialog>

        {user ? (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full group-hover:bg-primary/90">
                Book Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book Room {room.number}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4 pt-4"
                >
                  <FormField
                    control={form.control}
                    name="checkIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-in Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="checkOut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-out Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createReservation.isPending}
                  >
                    {createReservation.isPending
                      ? "Confirming..."
                      : "Confirm Reservation"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        ) : (
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Sign in to Book
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
