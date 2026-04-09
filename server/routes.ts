import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { setupAuth } from "./auth.js";
import { api } from "../shared/routes.js";
import { z } from "zod";
import { sendBookingNotification, sendOrderNotification } from "./email.js";
import type {
  InsertRoom,
  InsertReservation,
  InsertMenuItem,
  InsertOrder,
} from "../shared/schema.js";
import Stripe from "stripe";
import {
  menuItems,
  rooms,
  insertRoomSchema,
  insertReservationSchema,
  insertMenuItemSchema,
  insertOrderSchema,
  insertMaintenanceRequestSchema,
} from "../shared/schema.js";

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

      // Auto-mark room as dirty when guest checks out
      if (req.body.status === "checked_out") {
        storage.upsertHousekeepingTask(reservation.roomId, {
          status: "dirty",
          notes: `Auto-flagged after check-out on ${new Date().toLocaleDateString()}`,
        }).catch(() => {});
        storage.createNotification({
          type: "reservation",
          title: "Room Needs Cleaning",
          body: `Room for reservation #${reservation.id} was checked out and needs housekeeping.`,
          isRead: false,
        }).catch(() => {});
      }


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
  

  // ─── Housekeeping Routes ─────────────────────────────────────────────────────

app.get("/api/housekeeping", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const user = req.user as any;
  if (!["staff", "manager", "admin"].includes(user.role)) return res.sendStatus(403);
  const tasks = await storage.getHousekeepingTasks();
  res.json(tasks);
});

app.patch("/api/housekeeping/:roomId", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const user = req.user as any;
  if (!["staff", "manager", "admin"].includes(user.role)) return res.sendStatus(403);

  const roomId = Number(req.params.roomId);
  const { status, notes, assignedTo, scheduledFor } = req.body;

  const task = await storage.upsertHousekeepingTask(roomId, {
    status,
    notes,
    assignedTo: assignedTo ?? null,
    scheduledFor: scheduledFor ?? null,
  });

  // Notify when a room is marked clean or inspected
  if (status === "clean" || status === "inspected") {
    const room = await storage.getRoom(roomId);
    storage.createNotification({
      type: "reservation",
      title: status === "inspected" ? "Room Inspected & Ready" : "Room Cleaned",
      body: `Room ${room?.number ?? roomId} has been marked as ${status}.`,
      isRead: false,
    }).catch(() => {});
  }

  res.json(task);
});

// ─── Maintenance Routes ───────────────────────────────────────────────────────

app.get("/api/maintenance", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const user = req.user as any;

  // Staff/admin see all; guests see only their own
  const requests =
    ["staff", "manager", "admin"].includes(user.role)
      ? await storage.getMaintenanceRequests()
      : await storage.getMaintenanceRequestsByUser(user.id);

  res.json(requests.slice().reverse()); // newest first
});

app.post("/api/maintenance", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const user = req.user as any;

  try {
    const input = insertMaintenanceRequestSchema.parse(req.body);

    // ✅ Explicitly construct the object with required fields
    const request = await storage.createMaintenanceRequest({
      title: input.title,
      description: input.description,
      reportedById: user.id,
      roomId: input.roomId ? Number(input.roomId) : undefined,
      priority: input.priority,
      status: input.status,
      assignedTo: input.assignedTo ? Number(input.assignedTo) : undefined,
      notes: input.notes,
    });

    // Notify staff of new request
    const priorityLabel = request.priority === "urgent" ? "🚨 URGENT" : request.priority;
    storage.createNotification({
      type: "order",
      title: `New Maintenance Request [${priorityLabel}]`,
      body: `"${request.title}" ${request.roomId ? `— Room ${request.roomId}` : "(Common Area)"}. Reported by user #${user.id}.`,
      isRead: false,
    }).catch(() => {});

    res.status(201).json(request);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.issues[0].message });
    } else {
      res.status(500).json({ message: "Failed to create request" });
    }
  }
});

app.patch("/api/maintenance/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const user = req.user as any;
  if (!["staff", "manager", "admin"].includes(user.role)) return res.sendStatus(403);

  const updates: Record<string, any> = { ...req.body };

  // Stamp resolved time when marking resolved
  if (req.body.status === "resolved") {
    updates.resolvedAt = new Date();
  }

  const updated = await storage.updateMaintenanceRequest(Number(req.params.id), updates);
  if (!updated) return res.status(404).json({ message: "Request not found" });
  res.json(updated);
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

  // ✅ SEED FUNCTION
  async function seed() {
    console.log("[seed] Checking database...");

    const currentMenu = await storage.getMenuItems();

    if (currentMenu.length === 0) {
      console.log("[seed] Seeding menu...");

      await storage.createMenuItem({
        name: "Jollof Rice with Chicken",
        description: "Classic Ghanaian Jollof",
        price: 85,
        category: "main",
        available: true,
      });

      // add more items...
    }

    console.log("[seed] Done.");
  }

  seed().catch(console.error);
  return httpServer;
}






















// import type { Express } from "express";
// import type { Server } from "http";
// import { storage } from "./storage.js";
// import { setupAuth } from "./auth.js";
// import { api } from "../shared/routes.js";
// import { z } from "zod";
// import { sendBookingNotification, sendOrderNotification } from "./email.js";
// import {
//   menuItems,
//   rooms,
//   insertRoomSchema,
//   insertReservationSchema,
//   insertMenuItemSchema,
//   insertOrderSchema,
// } from "../shared/schema.js";
// import type {
//   InsertRoom,
//   InsertReservation,
//   InsertMenuItem,
//   InsertOrder,
// } from "../shared/schema.js";
// import { eq, sql } from "drizzle-orm";

// export async function registerRoutes(
//   httpServer: Server,
//   app: Express
// ): Promise<Server> {
//   setupAuth(app);

//   // Rooms
//   app.get(api.rooms.list.path, async (req, res) => {
//     const rooms = await storage.getRooms();
//     res.json(rooms);
//   });

//   app.get(api.rooms.get.path, async (req, res) => {
//     const room = await storage.getRoom(Number(req.params.id));
//     if (!room) return res.status(404).json({ message: "Room not found" });
//     res.json(room);
//   });

//   app.post(api.rooms.create.path, async (req, res) => {
//     try {
//       const input = insertRoomSchema.parse(req.body) as unknown as InsertRoom;
//       const room = await storage.createRoom(input) as typeof rooms.$inferSelect;
//       res.status(201).json(room);
//     } catch (err) {
//       if (err instanceof z.ZodError) {
//         res.status(400).json({ message: err.issues[0].message });
//       } else {
//         res.status(500).json({ message: "Internal server error" });
//       }
//     }
//   });

//   app.put(api.rooms.update.path, async (req, res) => {
//     const input = insertRoomSchema.partial().parse(req.body) as unknown as Partial<InsertRoom>;
//     const room = await storage.updateRoom(Number(req.params.id), input);
//     if (!room) return res.status(404).json({ message: "Room not found" });
//     res.json(room);
//   });

//   app.delete(api.rooms.delete.path, async (req, res) => {
//     const success = await storage.deleteRoom(Number(req.params.id));
//     if (!success) return res.status(404).json({ message: "Room not found" });
//     res.json({ message: "Room deleted successfully" });
//   });

//   // Reservations
//   app.get(api.reservations.list.path, async (req, res) => {
//     const reservations = await storage.getReservations();
//     res.json(reservations);
//   });

//   app.post(api.reservations.create.path, async (req, res) => {
//     try {
//       const input = insertReservationSchema.parse(req.body) as unknown as InsertReservation;
//       const reservation = await storage.createReservation(input);
      
//       // Send notification
//       const user = await storage.getUser(reservation.userId);
//       const room = await storage.getRoom(reservation.roomId);
//       if (user && room) {
//         sendBookingNotification({
//           guestName: user.name,
//           roomNumber: room.number,
//           checkIn: reservation.checkIn,
//           checkOut: reservation.checkOut,
//           totalPrice: reservation.totalPrice,
//         });
//       }

//       // Fire in-app notification for staff (reuse already-fetched user/room)
//       storage.createNotification({
//         type: "reservation",
//         title: "New Room Reservation",
//         body: `${user?.name ?? "A guest"} booked Room ${room?.number ?? reservation.roomId} (${new Date(reservation.checkIn).toLocaleDateString()} – ${new Date(reservation.checkOut).toLocaleDateString()})`,
//         isRead: false,
//       }).catch(() => {});

//       res.status(201).json(reservation);
//     } catch (err) {
//        if (err instanceof z.ZodError) {
//         res.status(400).json({ message: err.issues[0].message });
//       } else {
//         res.status(500).json({ message: "Internal server error" });
//       }
//     }
//   });

//   app.patch(api.reservations.updateStatus.path, async (req, res) => {
//     const reservation = await storage.updateReservationStatus(Number(req.params.id), req.body.status);
//     if (!reservation) return res.status(404).json({ message: "Reservation not found" });
//     res.json(reservation);
//   });

//   // Menu
//   app.get(api.menu.list.path, async (req, res) => {
//     const menu = await storage.getMenuItems();
//     res.json(menu);
//   });

//   app.post(api.menu.create.path, async (req, res) => {
//     const input = insertMenuItemSchema.parse(req.body) as unknown as InsertMenuItem;
//     const item = await storage.createMenuItem(input);
//     res.status(201).json(item);
//   });

//   app.delete(api.menu.delete.path, async (req, res) => {
//     const success = await storage.deleteMenuItem(Number(req.params.id));
//     if (!success) return res.status(404).json({ message: "Menu item not found" });
//     res.json({ message: "Menu item deleted successfully" });
//   });

//   app.put(api.menu.update.path, async (req, res) => {
//     const input = insertMenuItemSchema.partial().parse(req.body) as unknown as Partial<InsertMenuItem>;
//     const item = await storage.updateMenuItem(Number(req.params.id), input);
//     if (!item) return res.status(404).json({ message: "Menu item not found" });
//     res.json(item);
//   });

//   // Orders
//   app.get(api.orders.list.path, async (req, res) => {
//     const orders = await storage.getOrders();
//     res.json(orders);
//   });

//   app.post(api.orders.create.path, async (req, res) => {
//     try {
//       const input = z
//         .object({
//           order: insertOrderSchema,
//           items: z.array(z.object({ menuItemId: z.number(), quantity: z.number() })),
//         })
//         .parse(req.body);
//       const { order, items } = input;

//       const newOrder = await storage.createOrder(
//         order as unknown as InsertOrder,
//         items as { menuItemId: number; quantity: number }[]
//       );
      
//       // Send notification
//       const mItems = await storage.getMenuItems();
//       const orderNotificationItems = items.map((item) => {
//         const menuItem = mItems.find(mi => mi.id === item.menuItemId);
//         return {
//           name: menuItem?.name || "Unknown Item",
//           quantity: item.quantity
//         };
//       });
      
//       sendOrderNotification({
//         orderId: newOrder.id,
//         type: newOrder.type,
//         totalAmount: newOrder.totalAmount,
//         items: orderNotificationItems,
//       });

//       // Fire in-app notification (non-blocking)
//       const orderTypeLabel = newOrder.type === "room_service" ? "Room Service" : newOrder.type === "take_away" ? "Take Away" : "Dine In";
//       storage.createNotification({
//         type: "order",
//         title: `New ${orderTypeLabel} Order`,
//         body: `Order #${newOrder.id} — GH₵${newOrder.totalAmount} (${orderNotificationItems.map(i => `${i.name} x${i.quantity}`).join(", ")})`,
//         isRead: false,
//       }).catch(() => {});

//       res.status(201).json(newOrder);
//     } catch (err) {
//       if (err instanceof z.ZodError) {
//         res.status(400).json({ message: err.issues[0].message });
//       } else {
//         res.status(500).json({ message: "Internal server error" });
//       }
//     }
//   });

//   app.patch(api.orders.updateStatus.path, async (req, res) => {
//     const order = await storage.updateOrderStatus(Number(req.params.id), req.body.status);
//     if (!order) return res.status(404).json({ message: "Order not found" });
//     res.json(order);
//   });

//   // Chat
//   app.get(api.chat.list.path, async (req, res) => {
//     const messages = await storage.getMessages();
//     res.json(messages);
//   });

//   app.post(api.chat.send.path, async (req, res) => {
//     if (!req.isAuthenticated()) return res.sendStatus(401);
//     const user = req.user as any;
//     try {
//       const message = await storage.createMessage({
//         senderId: user.id,
//         content: req.body.content,
//         isAdmin: user.role !== "guest",
//       });
//       res.status(201).json(message);
//     } catch (err) {
//       res.status(500).json({ message: "Failed to send message" });
//     }
//   });

//   // Notifications
//   app.get("/api/notifications", async (req, res) => {
//     if (!req.isAuthenticated()) return res.sendStatus(401);
//     const all = await storage.getNotifications();
//     res.json(all.slice().reverse()); // newest first
//   });

//   app.patch("/api/notifications/:id/read", async (req, res) => {
//     if (!req.isAuthenticated()) return res.sendStatus(401);
//     const notification = await storage.markNotificationRead(Number(req.params.id));
//     if (!notification) return res.status(404).json({ message: "Notification not found" });
//     res.json(notification);
//   });

//   app.patch("/api/notifications/read-all", async (req, res) => {
//     if (!req.isAuthenticated()) return res.sendStatus(401);
//     await storage.markAllNotificationsRead();
//     res.json({ success: true });
//   });

//   // Seed data function (simple check)
//   async function seed() {
//     console.log("[seed] Starting database seeding check...");
    
//     // 1. Force cleanup of old mock data
//     await storage.db.delete(menuItems).where(eq(menuItems.name, "Bruschetta"));
//     await storage.db.delete(menuItems).where(eq(menuItems.name, "Steak Frites"));
//     await storage.db.delete(menuItems).where(eq(menuItems.name, "Tiramisu"));
    
//     // Cleanup any room types that aren't in our allowed list
//     await storage.db.delete(rooms).where(
//       sql`type NOT IN ('standard', 'executive', 'apartment')`
//     );

//     // 2. Create admin account if none exist
//     const adminExists = await storage.getUserByUsername("admin");
//     if (!adminExists) {
//       console.log("[seed] Creating admin user...");
//       const { scrypt, randomBytes } = await import("crypto");
//       const { promisify } = await import("util");
//       const scryptAsync = promisify(scrypt);
//       const salt = randomBytes(16).toString("hex");
//       const buf = (await scryptAsync("admin123", salt, 64)) as Buffer;
//       const hashedPassword = `${buf.toString("hex")}.${salt}`;
//       await storage.createUser({ username: "admin", password: hashedPassword, role: "admin", name: "Admin User" });
//     }
    
//     const currentRooms = await storage.getRooms();
//     console.log(`[seed] Current rooms count: ${currentRooms.length}`);
    
//     // Force price sync if rooms already exist but have old prices
//     if (currentRooms.length > 0) {
//       console.log("[seed] Syncing room prices...");
//       await storage.db.execute(sql`
//         UPDATE rooms SET price = CASE 
//           WHEN type = 'standard' THEN 400 
//           WHEN type = 'executive' THEN 600 
//           WHEN type = 'apartment' THEN 600 
//           ELSE price 
//         END
//       `);
//     }

//     if (currentRooms.length === 0) {
//         console.log("[seed] Seeding correct rooms...");
//         await storage.createRoom({ number: "101", type: "standard", price: 300, description: "Cozy standard room with double bed and essential amenities.", capacity: 2, isAvailable: true });
//         await storage.createRoom({ number: "102", type: "standard", price: 300, description: "Comfortable standard room perfect for business travelers.", capacity: 2, isAvailable: true });
//         await storage.createRoom({ number: "201", type: "executive", price: 500, description: "Spacious executive room with premium furnishings and balcony.", capacity: 2, isAvailable: true });
//         await storage.createRoom({ number: "202", type: "executive", price: 500, description: "Luxury executive suite with separate seating area.", capacity: 2, isAvailable: true });
//         await storage.createRoom({ number: "301", type: "apartment", price: 600, description: "Large apartment featuring a kitchenette and master bath.", capacity: 4, isAvailable: true });
//         await storage.createRoom({ number: "302", type: "apartment", price: 600, description: "Family-sized apartment with private terrace.", capacity: 4, isAvailable: true });
//     }

//     const currentMenu = await storage.getMenuItems();
//     console.log(`[seed] Current menu items count: ${currentMenu.length}`);
    
//     // Check if we need to force-seed the full menu
//     const hasFullMenu = currentMenu.length >= 40;
    
//     if (!hasFullMenu) {
//         console.log("[seed] Seeding full VIP menu...");
//         // await storage.db.delete(menuItems);

//         const menuData = [
//           // MAIN MENU
//           { name: "Fried Rice with Fried/Grilled Chicken", price: 85, category: "main", description: "Savory fried rice served with crispy fried or succulent grilled chicken." },
//           { name: "Jollof Rice with Fried/Grilled Chicken", price: 85, category: "main", description: "Classic Ghanaian Jollof rice paired with delicious chicken." },
//           { name: "Assorted Jollof / Fried Rice", price: 100, category: "main", description: "A rich mix of Jollof and Fried rice with various meats." },
//           { name: "Special Tasty Waakye", price: 65, category: "main", description: "Traditional Waakye served with shito, egg, and meat." },
//           { name: "Jollof/Fried Rice with Fried Goat Meat", price: 100, category: "main", description: "Hearty rice served with tender fried goat meat." },
//           { name: "Jollof / Fried Rice with Chicken Wings", price: 95, category: "main", description: "Choice of rice served with spicy or fried chicken wings." },
//           { name: "Fried/Jollof Rice with Fried Plantain & Chicken", price: 105, category: "main", description: "A complete meal with rice, chicken, and sweet fried plantains." },
//           { name: "Plain Rice with Grilled / Fried Chicken", price: 85, category: "main", description: "Steamed plain rice served with flavorful chicken." },
//           { name: "Fried/Jollof /Plain Rice with Tilapia", price: 130, category: "main", description: "Rice served with fresh grilled or fried tilapia." },
//           { name: "Chicken Chops", price: 50, category: "main", description: "Succulent pieces of seasoned chicken chops." },
//           { name: "Spicy Chicken Wings", price: 50, category: "main", description: "Crispy wings tossed in spicy pepper sauce." },

//           // PIZZAS
//           { name: "Fosua Special Pizza (Large)", price: 200, category: "main", description: "Our signature house pizza with assorted toppings." },
//           { name: "Fosua Special Pizza (Medium)", price: 165, category: "main", description: "Our signature house pizza with assorted toppings." },
//           { name: "Cheese Pizza (Small)", price: 115, category: "main", description: "Pizza topped with melty cheese and peppers." },
//           { name: "Cheese Pizza (Medium)", price: 150, category: "main", description: "Pizza topped with melty cheese and peppers." },
//           { name: "Cheese Pizza (Large)", price: 185, category: "main", description: "Pizza topped with melty cheese and peppers." },
//           { name: "Beef Pizza (Small)", price: 115, category: "main", description: "Pizza topped with seasoned ground beef." },
//           { name: "Beef Pizza (Medium)", price: 150, category: "main", description: "Pizza topped with seasoned ground beef." },
//           { name: "Beef Pizza (Large)", price: 185, category: "main", description: "Pizza topped with seasoned ground beef." },

//           // APPETIZERS
//           { name: "Spring Roll", price: 15, category: "appetizer", description: "Crispy vegetable or meat spring rolls." },
//           { name: "Samosa", price: 15, category: "appetizer", description: "Savory triangle pastry with spiced filling." },
//           { name: "Gizzard", price: 20, category: "appetizer", description: "Grilled or fried spiced gizzards." },
//           { name: "Sausage", price: 20, category: "appetizer", description: "Grilled savory sausages." },
//           { name: "Kelewele", price: 50, category: "appetizer", description: "Spiced fried plantain chunks - a local favorite." },
//           { name: "Breakfast", price: 55, category: "appetizer", description: "Hearty morning meal options." },
//           { name: "Shawarma", price: 60, category: "appetizer", description: "Chicken or beef wrapped in flatbread with sauce." },
//           { name: "Sandwich", price: 85, category: "appetizer", description: "Freshly made toasted sandwiches." },
//           { name: "Burger", price: 85, category: "appetizer", description: "Juicy burger with fresh toppings." },

//           // LOCAL DISHES WITH FUFU
//           { name: "Dry Light Soup", price: 110, category: "main", description: "Light and spicy soup served with Fufu." },
//           { name: "Assorted Palm nut Soup", price: 120, category: "main", description: "Rich palm nut soup with various meats." },
//           { name: "Chicken Light Soup", price: 90, category: "main", description: "Clear spicy soup with tender chicken." },
//           { name: "Goat Light Soup", price: 100, category: "main", description: "Classic Ghanaian light soup with goat meat." },
//           { name: "Medium Size Tilapia Light Soup", price: 130, category: "main", description: "Tilapia soup bursting with flavor." },
//           { name: "Big Size Tilapia Light Soup", price: 150, category: "main", description: "Hearty tilapia soup for the hungry." },
//           { name: "Abunuabunu", price: 120, category: "main", description: "Traditional green soup with snails and mushrooms." },

//           // SPECIAL DISHES
//           { name: "Boiled Yam with Kontomire Stew/Palava Sauce", price: 120, category: "main", description: "Traditional yam served with spinach-based sauce." },
//           { name: "Boiled Plantain with Kontomire Stew/Palava Sauce", price: 120, category: "main", description: "Sweet boiled plantain with palava sauce." },
//           { name: "Boiled Yam/ Plantain with Garden Egg Stew", price: 120, category: "main", description: "Choice of yam or plantain with garden egg stew." },

//           // FRIES
//           { name: "Yam Chips & Chicken", price: 85, category: "main", description: "Fried yam slices with seasoned chicken." },
//           { name: "Yam Chips & Fried Fish", price: 100, category: "main", description: "Fried yam slices with crispy fish." },
//           { name: "Yam with Grilled Tilapia", price: 130, category: "main", description: "Boiled or fried yam with grilled tilapia." },
//           { name: "Potato Chips with Chicken", price: 85, category: "main", description: "Classic french fries with chicken." },
//           { name: "Potato Chips with Fried Fish", price: 100, category: "main", description: "French fries served with fried fish." },
//           { name: "Potato Chips with Tilapia", price: 130, category: "main", description: "French fries served with tilapia." },
//           { name: "Loaded Fried with Chicken", price: 100, category: "main", description: "Fries topped with chicken and sauces." },
//           { name: "Special Indomie", price: 85, category: "main", description: "Instant noodles stir-fried with vegetables and egg." },
//           { name: "Special Spaghetti", price: 80, category: "main", description: "Stir-fried spaghetti with rich tomato sauce." },

//           // JUICES & SALADS
//           { name: "Pineapple Juice (Small)", price: 20, category: "drink", description: "Fresh pineapple juice." },
//           { name: "Pineapple Juice (Big)", price: 25, category: "drink", description: "Fresh pineapple juice." },
//           { name: "Sobolo Drink (Small)", price: 20, category: "drink", description: "Local hibiscus drink." },
//           { name: "Sobolo Drink (Big)", price: 25, category: "drink", description: "Local hibiscus drink." },
//           { name: "Vegetable Salad & Grilled Chicken", price: 90, category: "main", description: "Fresh garden salad with grilled chicken." },
//           { name: "Vegetable Salad & Fried Fish", price: 100, category: "main", description: "Fresh garden salad with fried fish." },

//           // LOCAL DISHES
//           { name: "Banku with Medium Tilapia", price: 130, category: "main", description: "Fermented corn and cassava dough with tilapia." },
//           { name: "Banku with Large Tilapia", price: 150, category: "main", description: "Fermented corn and cassava dough with large tilapia." },
//           { name: "Banku with Goat (Okro)", price: 100, category: "main", description: "Banku served with okra stew and goat meat." },
//           { name: "Banku with Assorted Soup", price: 120, category: "main", description: "Banku served with a mix of delicious soups." }
//         ];

//         for (const item of menuData) {
//           await storage.createMenuItem({ ...item, available: true });
//         }
//     }
//     console.log("[seed] Database seeding check completed.");
//   }

//   seed();

//   return httpServer;
// }


