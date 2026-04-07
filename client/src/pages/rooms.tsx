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
import { PaymentModal } from "@/components/payment-modal";
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
      <div className="bg-muted/30 py-12 text-center">
        <h1 className="text-4xl font-bold">Our Rooms</h1>
        <p className="text-muted-foreground">
          Choose from our selection of rooms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} user={user} />
        ))}
      </div>
    </Layout>
  );
}

function RoomCard({ room, user }: { room: any; user: any }) {
  const { createReservation, reservations } = useReservations();

  const [isOpen, setIsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // ✅ Stripe modal state
  const [paymentModal, setPaymentModal] = useState<{
    id: number;
    amount: number;
  } | null>(null);

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
  });

  const roomEvents = (reservations || [])
    .filter((r: any) => r.roomId === room.id && r.status !== "cancelled")
    .map((r: any) => ({
      title: "Reserved",
      start: r.checkIn,
      end: r.checkOut,
    }));

  const getRoomImage = (type: string) => {
    if (type.toLowerCase().includes("standard")) return standardRoomImgPath;
    if (type.toLowerCase().includes("executive")) return executiveRoomImgPath;
    return roomImgPath;
  };

  const onSubmit = (data: z.infer<typeof bookingSchema>) => {
    const start = new Date(data.checkIn);
    const end = new Date(data.checkOut);

    const nights = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) return;

    const totalPrice = room.price * nights;

    createReservation.mutate(
      {
        roomId: room.id,
        userId: user.id,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        totalPrice,
        status: "confirmed",
      },
      {
        onSuccess: (newReservation) => {
          setIsOpen(false);

          // ✅ OPEN STRIPE MODAL
          setPaymentModal({
            id: newReservation.id,
            amount: totalPrice,
          });
        },
      }
    );
  };

  return (
    <>
      <Card className="flex flex-col">
        <img
          src={getRoomImage(room.type)}
          className="h-48 object-cover"
        />

        <CardHeader>
          <CardTitle>
            {room.number} - {room.type}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p>{room.description}</p>
          <p className="font-bold">GH₵{room.price}</p>
        </CardContent>

        <CardFooter className="flex gap-2">
          {/* Calendar */}
          <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <CalendarIcon />
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Availability</DialogTitle>
              </DialogHeader>

              <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={roomEvents}
              />
            </DialogContent>
          </Dialog>

          {/* Booking */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                Book Now <ArrowRight className="ml-2" />
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book Room {room.number}</DialogTitle>
              </DialogHeader>

              {user ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="checkIn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Check-in</FormLabel>
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
                          <FormLabel>Check-out</FormLabel>
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
                        ? "Processing..."
                        : "Confirm Reservation"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Link href="/login">
                  <Button>Login to Book</Button>
                </Link>
              )}
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      {/* ✅ STRIPE PAYMENT MODAL (FIXED) */}
      {paymentModal && (
        <PaymentModal
          open={true}
          onClose={() => setPaymentModal(null)}
          onSuccess={() => {
            setPaymentModal(null);
          }}
          type="reservation"
          itemId={paymentModal.id}
          amount={paymentModal.amount}
        />
      )}
    </>
  );
}