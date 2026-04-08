import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { setupAuth } from "./auth.js";
import { api } from "../shared/routes.js";
import { z } from "zod";
import { sendBookingNotification, sendOrderNotification } from "./email.js";
import {
  insertRoomSchema,
  insertReservationSchema,
  insertMenuItemSchema,
  insertOrderSchema,
} from "../shared/schema.js";
import type {
  InsertRoom,
  InsertReservation,
  InsertMenuItem,
  InsertOrder,
} from "../shared/schema.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// =================== Helpers ===================

const convertGhsToUsd = (amountGhs: number) => {
  const rate = Number(process.env.GHS_USD_RATE || 0.079);
  return Math.round(amountGhs * rate * 100);
};

const validateId = (idParam: string, res: any) => {
  const id = Number(idParam);
  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid ID" });
    return null;
  }
  return id;
};

const requireAuth = (req: any, res: any) => {
  if (!req.isAuthenticated()) {
    res.sendStatus(401);
    return false;
  }
  return true;
};

const requireAdmin = (req: any, res: any) => {
  if (!req.isAuthenticated()) {
    res.sendStatus(401);
    return false;
  }
  if ((req.user as any).role !== "admin") {
    res.sendStatus(403);
    return false;
  }
  return true;
};

// =================== Routes ===================

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // =================== Payments ===================

  app.post("/api/payments/reservation-intent", async (req, res) => {
    try {
      const { reservationId } = req.body;
      if (!reservationId) {
        return res.status(400).json({ message: "Missing reservationId" });
      }

      const reservation = await storage.getReservation(reservationId);
      if (!reservation)
        return res.status(404).json({ message: "Reservation not found" });

      const amountUsdCents = convertGhsToUsd(reservation.totalPrice);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountUsdCents,
        currency: "usd",
        metadata: { reservationId: String(reservationId) },
      });

      await storage.updateReservationPayment(reservationId, {
        paymentIntentId: paymentIntent.id,
        paymentStatus: "pending",
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.post("/api/payments/order-intent", async (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ message: "Missing orderId" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });

      const amountUsdCents = convertGhsToUsd(order.totalAmount);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountUsdCents,
        currency: "usd",
        metadata: { orderId: String(orderId) },
      });

      await storage.updateOrderPayment(orderId, {
        paymentIntentId: paymentIntent.id,
        paymentStatus: "pending",
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });


  // ─── Paystack: Initialize payment ───────────────────────────────────────────
// Called before opening the popup. Backend initializes so the secret key
// is never exposed to the browser.
app.post("/api/paystack/initialize", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const { email, amount, metadata } = req.body;

  try {
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(Number(amount) * 100), // GH₵ → pesewas
        currency: "GHS",
        channels: ["mobile_money", "card"],
        metadata,
      }),
    });

    const data = await paystackRes.json() as any;
    if (!data.status) return res.status(400).json({ message: data.message });
    res.json({ reference: data.data.reference, access_code: data.data.access_code });
  } catch (err) {
    res.status(500).json({ message: "Failed to initialize payment" });
  }
});

// ─── Paystack: Verify payment then create reservation ────────────────────────
app.post("/api/paystack/verify-and-book", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const { reference, roomId, userId, checkIn, checkOut, totalPrice } = req.body;

  try {
    // 1. Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const verifyData = await verifyRes.json() as any;

    if (!verifyData.status || verifyData.data.status !== "success") {
      return res.status(400).json({ message: "Payment not successful. Please try again." });
    }

    // 2. Create the reservation now that payment is confirmed
    const reservation = await storage.createReservation({
      roomId: Number(roomId),
      userId: Number(userId),
      checkIn,
      checkOut,
      totalPrice: Number(totalPrice),
      status: "confirmed",
      paymentMethod: "mobile_money",
      paymentReference: reference,
      paymentStatus: "paid",
    });

    // 3. In-app notification
    const user = await storage.getUser(Number(userId));
    const room = await storage.getRoom(Number(roomId));
    storage.createNotification({
      type: "reservation",
      title: "New Room Reservation (Mobile Money)",
      body: `${user?.name ?? "A guest"} paid GH₵${totalPrice} via Mobile Money and booked Room ${room?.number ?? roomId} (${new Date(checkIn).toLocaleDateString()} – ${new Date(checkOut).toLocaleDateString()}). Ref: ${reference}`,
      isRead: false,
    }).catch(() => {});

    res.status(201).json(reservation);
  } catch (err: any) {
    res.status(400).json({ message: err.message ?? "Booking failed after payment" });
  }
});

// ─── Paystack: Verify payment then create order ──────────────────────────────
app.post("/api/paystack/verify-and-order", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const { reference, order, items } = req.body;

  try {
    // 1. Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const verifyData = await verifyRes.json() as any;

    if (!verifyData.status || verifyData.data.status !== "success") {
      return res.status(400).json({ message: "Payment not successful. Please try again." });
    }

    // 2. Create the order now that payment is confirmed
    const newOrder = await storage.createOrder(
      {
        ...order,
        paymentMethod: "mobile_money",
        paymentReference: reference,
        paymentStatus: "paid",
      },
      items
    );

    // 3. In-app notification
    const mItems = await storage.getMenuItems();
    const orderTypeLabel =
      newOrder.type === "room_service" ? "Room Service"
      : newOrder.type === "take_away" ? "Take Away"
      : "Dine In";
    const itemSummary = items.map((item: any) => {
      const mi = mItems.find((m) => m.id === item.menuItemId);
      return `${mi?.name ?? "Item"} x${item.quantity}`;
    }).join(", ");

    storage.createNotification({
      type: "order",
      title: `New ${orderTypeLabel} Order (Mobile Money)`,
      body: `Order #${newOrder.id} paid GH₵${newOrder.totalAmount} via Mobile Money. ${itemSummary}. Ref: ${reference}`,
      isRead: false,
    }).catch(() => {});

    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(500).json({ message: err.message ?? "Order failed after payment" });
  }
});

  app.post("/api/payments/confirm", async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Missing paymentIntentId" });
      }

      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (intent.status === "succeeded") {
        const { reservationId, orderId } = intent.metadata;

        if (reservationId) {
          await storage.updateReservationPayment(Number(reservationId), {
            paymentStatus: "paid",
          });
        }

        if (orderId) {
          await storage.updateOrderPayment(Number(orderId), {
            paymentStatus: "paid",
          });
        }

        res.json({ success: true });
      } else {
        res.status(400).json({ message: "Payment not completed" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // =================== Rooms ===================

  app.get(api.rooms.list.path, async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get(api.rooms.get.path, async (req, res) => {
    try {
      const id = validateId(req.params.id, res);
      if (!id) return;

      const room = await storage.getRoom(id);
      if (!room) return res.status(404).json({ message: "Room not found" });

      res.json(room);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.post(api.rooms.create.path, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const input = insertRoomSchema.parse(req.body) as InsertRoom;
      const room = await storage.createRoom(input);
      res.status(201).json(room);
    } catch (err) {
      console.error(err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put(api.rooms.update.path, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const id = validateId(req.params.id, res);
      if (!id) return;

      const input = insertRoomSchema.partial().parse(req.body) as Partial<InsertRoom>;
      const room = await storage.updateRoom(id, input);

      if (!room) return res.status(404).json({ message: "Room not found" });

      res.json(room);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update room" });
    }
  });

  app.delete(api.rooms.delete.path, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const id = validateId(req.params.id, res);
      if (!id) return;

      const success = await storage.deleteRoom(id);
      if (!success) return res.status(404).json({ message: "Room not found" });

      res.json({ message: "Room deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete room" });
    }
  });

  // =================== Reservations ===================

  app.get(api.reservations.list.path, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  app.post(api.reservations.create.path, async (req, res) => {
    try {
      const input = insertReservationSchema.parse(req.body) as InsertReservation;
      const reservation = await storage.createReservation(input);

      const user = await storage.getUser(reservation.userId);
      const room = await storage.getRoom(reservation.roomId);

      if (user && room) {
        sendBookingNotification({
          guestName: user.name,
          roomNumber: room.number,
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          totalPrice: reservation.totalPrice,
        });
      }

      void storage.createNotification({
        type: "reservation",
        title: "New Room Reservation",
        body: `${user?.name ?? "A guest"} booked Room ${
          room?.number ?? reservation.roomId
        }`,
        isRead: false,
      }).catch(console.error);

      res.status(201).json(reservation);
    } catch (err) {
      console.error(err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  const statusSchema = z.object({
    status: z.enum(["pending", "confirmed", "cancelled"]),
  });

  app.patch(api.reservations.updateStatus.path, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const id = validateId(req.params.id, res);
      if (!id) return;

      const { status } = statusSchema.parse(req.body);

      const reservation = await storage.updateReservationStatus(id, status);
      if (!reservation)
        return res.status(404).json({ message: "Reservation not found" });

      res.json(reservation);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update reservation" });
    }
  });

  // =================== Orders ===================

  app.get(api.orders.list.path, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  const orderStatusSchema = z.object({
    status: z.enum(["pending", "preparing", "completed"]),
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const id = validateId(req.params.id, res);
      if (!id) return;

      const { status } = orderStatusSchema.parse(req.body);
      

      const order = await storage.updateOrderStatus(id, status);
      if (!order) return res.status(404).json({ message: "Order not found" });

      res.json(order);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update order" });
    }
  });
  

  // =================== Chat ===================

  app.post(api.chat.send.path, async (req, res) => {
    if (!requireAuth(req, res)) return;
    try {
      const schema = z.object({
        content: z.string().min(1).max(1000),
      });

      const { content } = schema.parse(req.body);

      const user = req.user as any;

      const message = await storage.createMessage({
        senderId: user.id,
        content,
        isAdmin: user.role !== "guest",
      });

      res.status(201).json(message);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  return httpServer;
}