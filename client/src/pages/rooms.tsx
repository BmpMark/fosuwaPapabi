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
import { PaystackPayment } from "@/components/paystack-payment";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { PaymentModal } from "@/components/payment-modal";

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


function RoomCard({ room, user, isManagerRoom }: { room: any; user: any; isManagerRoom?: boolean }) {
  const { createReservation, reservations } = useReservations();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money">("cash");
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{ id: number; amount: number } | null>(null);
  const resolvedIsManagerRoom = isManagerRoom ?? room.number === "2";
  const roomEvents = (reservations || [])
    .filter((r: any) => r.roomId === room.id && r.status !== "cancelled")
    .map((r: any) => ({
      title: r.status === "checked_in" ? "Occupied" : "Reserved",
      start: r.checkIn,
      end: r.checkOut,
      backgroundColor: r.status === "checked_in" ? "#ef4444" : "#f59e0b",
      borderColor: "transparent",
    }));
  const getRoomImage = (type: string) => {
    if (type.toLowerCase().includes("standard")) return standardRoomImgPath;
    if (type.toLowerCase().includes("executive")) return executiveRoomImgPath;
    return roomImgPath;
  };
  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { checkIn: "", checkOut: "" },
  });
  // Calculate nights & price from current form values
  const watchCheckIn = form.watch("checkIn");
  const watchCheckOut = form.watch("checkOut");
  const nights = (() => {
    if (!watchCheckIn || !watchCheckOut) return 0;
    const n = Math.ceil(
      (new Date(watchCheckOut).getTime() - new Date(watchCheckIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return n > 0 ? n : 0;
  })();
  const totalPrice = room.price * nights;
  // ── Cash booking (existing flow) ──────────────────────────────────────────
  const onSubmitCash = (data: z.infer<typeof bookingSchema>) => {
    if (nights <= 0) return;
    createReservation.mutate(
      {
        roomId: room.id,
        userId: user.id,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        totalPrice,
        status: "confirmed",
        paymentMethod: "cash",
        paymentStatus: "pending",
      },
      onSuccess: (newReservation) => {
        setPaymentModal({ id: newReservation.id, amount: newReservation.totalPrice });
        setIsOpen(false);
      }
    );
  };
  // ── Mobile Money: called after Paystack popup succeeds ────────────────────
  const handlePaystackSuccess = async (reference: string) => {
    const { checkIn, checkOut } = form.getValues();
    if (!checkIn || !checkOut || nights <= 0) return;
    setIsVerifying(true);
    try {
      const res = await apiRequest("POST", "/api/paystack/verify-and-book", {
        reference,
        roomId: room.id,
        userId: user.id,
        checkIn,
        checkOut,
        totalPrice,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      queryClient.invalidateQueries({ queryKey: [api.reservations.list.path] });
      toast({ title: "Payment Successful!", description: `Room ${room.number} is booked. Ref: ${reference}` });
      setIsOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Booking Failed", description: err.message });
    } finally {
      setIsVerifying(false);
    }
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
        {/* Calendar availability */}
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
                headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
                height="auto"
              />
            </div>
          </DialogContent>
        </Dialog>
        {resolvedIsManagerRoom ? (
          <Button variant="outline" className="w-full cursor-not-allowed opacity-70" disabled>
            Management Only
          </Button>
        ) : (
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
              {user ? (
                <Form {...form}>
                  <form className="space-y-4 pt-2">
                    {/* Date fields */}
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
                    {/* Price summary */}
                    {nights > 0 && (
                      <div className="rounded-lg bg-muted px-4 py-3 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {nights} night{nights > 1 ? "s" : ""} × GH₵{room.price}
                          </span>
                          <span className="font-semibold">GH₵{totalPrice}</span>
                        </div>
                      </div>
                    )}
                    {/* Payment method */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Payment Method</Label>
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={(v) => setPaymentMethod(v as any)}
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="cash" id="room-cash" />
                          <Label htmlFor="room-cash" className="cursor-pointer flex-1">
                            <span className="font-medium">Cash</span>
                            <span className="block text-xs text-muted-foreground">
                              Pay at the hotel front desk
                            </span>
                          </Label>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="mobile_money" id="room-momo" />
                          <Label htmlFor="room-momo" className="cursor-pointer flex-1">
                            <span className="font-medium">Mobile Money / Card</span>
                            <span className="block text-xs text-muted-foreground">
                              MTN MoMo, Telecel Cash, AirtelTigo, Visa/Mastercard
                            </span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {/* Submit buttons */}
                    {paymentMethod === "cash" ? (
                      <Button
                        type="button"
                        className="w-full"
                        disabled={createReservation.isPending || nights <= 0}
                        onClick={form.handleSubmit(onSubmitCash)}
                      >
                        {createReservation.isPending ? "Confirming..." : "Confirm Reservation"}
                      </Button>
                    ) : (
                      <PaystackPayment
                        email={user.email ?? `${user.username}@fosuapapabi.com`}
                        amount={totalPrice}
                        label={`Pay GH₵${totalPrice} — Mobile Money / Card`}
                        metadata={{ roomId: room.id, userId: user.id, type: "reservation" }}
                        disabled={nights <= 0 || isVerifying || !form.formState.isValid}
                        onSuccess={handlePaystackSuccess}
                        onClose={() =>
                          toast({ title: "Payment cancelled", description: "No charge was made." })
                        }
                      />
                    )}
                    {paymentMethod === "mobile_money" && nights <= 0 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Select your check-in and check-out dates first
                      </p>
                    )}
                  </form>
                </Form>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <p className="text-center text-muted-foreground">
                    Please sign in to your account to complete this booking.
                  </p>
                  <Link href="/login" className="w-full">
                    <Button className="w-full">Sign in to Book</Button>
                  </Link>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
      {paymentModal && (
  <PaymentModal
    open
    type="reservation"
    itemId={paymentModal.id}
    amount={paymentModal.amount}
    onClose={() => setPaymentModal(null)}
    onSuccess={() => queryClient.invalidateQueries({ queryKey: [api.reservations.list.path] })}
  />
)}
    </Card>
  );
}