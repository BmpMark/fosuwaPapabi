import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { setupAuth } from "./auth.js";
import { api } from "../shared/routes.js";
import { z } from "zod";
import { sendBookingNotification, sendOrderNotification } from "./email.js";
import {
  menuItems,
  rooms,
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
import { eq, sql } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Simple GHS → USD conversion function
const convertGhsToUsd = (amountGhs: number) => {
  const rate = Number(process.env.GHS_USD_RATE || 0.079); // Default: 1 GHS ≈ 0.079 USD
  return Math.round(amountGhs * rate * 100); // Stripe expects cents
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // =================== Payments ===================

  // Create payment intent for a reservation
  app.post("/api/payments/reservation-intent", async (req, res) => {
    try {
      const { reservationId } = req.body;
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
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Create payment intent for a food order
  app.post("/api/payments/order-intent", async (req, res) => {
    try {
      const { orderId } = req.body;
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
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Confirm payment (called after Stripe confirms on frontend)
  app.post("/api/payments/confirm", async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
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
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // =================== Rooms ===================
  app.get(api.rooms.list.path, async (req, res) => {
    const rooms = await storage.getRooms();
    res.json(rooms);
  });

  app.get(api.rooms.get.path, async (req, res) => {
    const room = await storage.getRoom(Number(req.params.id));
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });

  app.post(api.rooms.create.path, async (req, res) => {
    try {
      const input = insertRoomSchema.parse(req.body) as unknown as InsertRoom;
      const room = await storage.createRoom(input);
      res.status(201).json(room);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put(api.rooms.update.path, async (req, res) => {
    const input = insertRoomSchema.partial().parse(req.body) as Partial<InsertRoom>;
    const room = await storage.updateRoom(Number(req.params.id), input);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });

  app.delete(api.rooms.delete.path, async (req, res) => {
    const success = await storage.deleteRoom(Number(req.params.id));
    if (!success) return res.status(404).json({ message: "Room not found" });
    res.json({ message: "Room deleted successfully" });
  });

  // =================== Reservations ===================
  app.get(api.reservations.list.path, async (req, res) => {
    const reservations = await storage.getReservations();
    res.json(reservations);
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

      res.status(201).json(reservation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch(api.reservations.updateStatus.path, async (req, res) => {
    const reservation = await storage.updateReservationStatus(
      Number(req.params.id),
      req.body.status
    );
    if (!reservation)
      return res.status(404).json({ message: "Reservation not found" });
    res.json(reservation);
  });

  // =================== Menu ===================
  app.get(api.menu.list.path, async (req, res) => {
    const menu = await storage.getMenuItems();
    res.json(menu);
  });

  app.post(api.menu.create.path, async (req, res) => {
    const input = insertMenuItemSchema.parse(req.body) as InsertMenuItem;
    const item = await storage.createMenuItem(input);
    res.status(201).json(item);
  });

  app.put(api.menu.update.path, async (req, res) => {
    const input = insertMenuItemSchema.partial().parse(req.body) as Partial<InsertMenuItem>;
    const item = await storage.updateMenuItem(Number(req.params.id), input);
    if (!item) return res.status(404).json({ message: "Menu item not found" });
    res.json(item);
  });

  app.delete(api.menu.delete.path, async (req, res) => {
    const success = await storage.deleteMenuItem(Number(req.params.id));
    if (!success) return res.status(404).json({ message: "Menu item not found" });
    res.json({ message: "Menu item deleted successfully" });
  });

  // =================== Orders ===================
  app.get(api.orders.list.path, async (req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = z
        .object({
          order: insertOrderSchema,
          items: z.array(z.object({ menuItemId: z.number(), quantity: z.number() })),
        })
        .parse(req.body);

      const { order, items } = input;

      // Keep items fully typed for storage
      const newOrder = await storage.createOrder(
        order as InsertOrder,
        items as { menuItemId: number; quantity: number }[]
      );

      // Map items only for notifications
      const mItems = await storage.getMenuItems();
      const orderNotificationItems = items.map((item) => {
        const menuItem = mItems.find((mi) => mi.id === item.menuItemId);
        return {
          name: menuItem?.name || "Unknown Item",
          quantity: item.quantity,
        };
      });

      sendOrderNotification({
        orderId: newOrder.id,
        type: newOrder.type,
        totalAmount: newOrder.totalAmount,
        items: orderNotificationItems,
      });

      res.status(201).json(newOrder);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    const order = await storage.updateOrderStatus(Number(req.params.id), req.body.status);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  // =================== Chat ===================
  app.get(api.chat.list.path, async (req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post(api.chat.send.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    try {
      const message = await storage.createMessage({
        senderId: user.id,
        content: req.body.content,
        isAdmin: user.role !== "guest",
      });
      res.status(201).json(message);
    } catch (err) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // =================== Seed Data ===================
  async function seed() {
    console.log("[seed] Starting database seeding check...");

    // ... [the same seeding logic you already had] ...

    console.log("[seed] Database seeding check completed.");
  }

  seed();

  return httpServer;
}