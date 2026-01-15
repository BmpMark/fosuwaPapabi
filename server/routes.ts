import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { sendBookingNotification, sendOrderNotification } from "./email";
import { menuItems } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Rooms
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
      const input = api.rooms.create.input.parse(req.body);
      const room = await storage.createRoom(input);
      res.status(201).json(room);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put(api.rooms.update.path, async (req, res) => {
    const input = api.rooms.update.input.parse(req.body);
    const room = await storage.updateRoom(Number(req.params.id), input);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });

  app.delete(api.rooms.delete.path, async (req, res) => {
    const success = await storage.deleteRoom(Number(req.params.id));
    if (!success) return res.status(404).json({ message: "Room not found" });
    res.json({ message: "Room deleted successfully" });
  });

  // Reservations
  app.get(api.reservations.list.path, async (req, res) => {
    const reservations = await storage.getReservations();
    res.json(reservations);
  });

  app.post(api.reservations.create.path, async (req, res) => {
    try {
      const input = api.reservations.create.input.parse(req.body);
      const reservation = await storage.createReservation(input);
      
      // Send notification
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
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch(api.reservations.updateStatus.path, async (req, res) => {
    const reservation = await storage.updateReservationStatus(Number(req.params.id), req.body.status);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    res.json(reservation);
  });

  // Menu
  app.get(api.menu.list.path, async (req, res) => {
    const menu = await storage.getMenuItems();
    res.json(menu);
  });

  app.post(api.menu.create.path, async (req, res) => {
    const input = api.menu.create.input.parse(req.body);
    const item = await storage.createMenuItem(input);
    res.status(201).json(item);
  });

  app.delete(api.menu.delete.path, async (req, res) => {
    const success = await storage.deleteMenuItem(Number(req.params.id));
    if (!success) return res.status(404).json({ message: "Menu item not found" });
    res.json({ message: "Menu item deleted successfully" });
  });

  app.put(api.menu.update.path, async (req, res) => {
    const input = api.menu.update.input.parse(req.body);
    const item = await storage.updateMenuItem(Number(req.params.id), input);
    if (!item) return res.status(404).json({ message: "Menu item not found" });
    res.json(item);
  });

  // Orders
  app.get(api.orders.list.path, async (req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.post(api.orders.create.path, async (req, res) => {
    const { order, items } = req.body;
    // Basic validation manual for nested structure
    const newOrder = await storage.createOrder(order, items);
    
    // Send notification
    try {
      const menuItems = await storage.getMenuItems();
      const orderItems = items.map((item: any) => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
        return {
          name: menuItem?.name || "Unknown Item",
          quantity: item.quantity
        };
      });
      
      sendOrderNotification({
        orderId: newOrder.id,
        type: newOrder.type,
        totalAmount: newOrder.totalAmount,
        items: orderItems,
      });
    } catch (error) {
      console.error("Failed to trigger order notification:", error);
    }

    res.status(201).json(newOrder);
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    const order = await storage.updateOrderStatus(Number(req.params.id), req.body.status);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  // Chat
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

  // Seed data function (simple check)
  async function seed() {
    console.log("[seed] Starting database seeding check...");
    
    // 1. Force cleanup of old mock data if it somehow persisted
    await storage.db.delete(menuItems).where(eq(menuItems.name, "Bruschetta"));
    await storage.db.delete(menuItems).where(eq(menuItems.name, "Steak Frites"));
    await storage.db.delete(menuItems).where(eq(menuItems.name, "Tiramisu"));

    // 2. Create admin account if none exist
    const adminExists = await storage.getUserByUsername("admin");
    if (!adminExists) {
      console.log("[seed] Creating admin user...");
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync("admin123", salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      await storage.createUser({ username: "admin", password: hashedPassword, role: "admin", name: "Admin User" });
    }
    
    const rooms = await storage.getRooms();
    console.log(`[seed] Current rooms count: ${rooms.length}`);
    if (rooms.length === 0) {
        console.log("[seed] Seeding rooms...");
        await storage.createRoom({ number: "101", type: "standard", price: 100, description: "Cozy standard room", capacity: 2, isAvailable: true });
        await storage.createRoom({ number: "102", type: "standard", price: 100, description: "Clean and comfortable standard room", capacity: 2, isAvailable: true });
        await storage.createRoom({ number: "201", type: "executive", price: 250, description: "Spacious executive room with premium amenities", capacity: 2, isAvailable: true });
        await storage.createRoom({ number: "202", type: "executive", price: 250, description: "Luxury executive suite", capacity: 2, isAvailable: true });
        await storage.createRoom({ number: "301", type: "apartment", price: 450, description: "Large apartment with kitchenette", capacity: 4, isAvailable: true });
        await storage.createRoom({ number: "302", type: "apartment", price: 450, description: "Family apartment suite", capacity: 4, isAvailable: true });
    }

    const menu = await storage.getMenuItems();
    console.log(`[seed] Current menu items count: ${menu.length}`);
    // Check if the current menu ONLY contains the old items or is empty
    const hasCorrectMenu = menu.some(item => item.name.includes("Rice") || item.name.includes("Chicken"));
    
    if (menu.length === 0 || !hasCorrectMenu) {
        console.log("[seed] Seeding correct menu items...");
        // Clear whatever is there to avoid duplicates or old items
        if (!hasCorrectMenu && menu.length > 0) {
            await storage.db.delete(menuItems);
        }

        await storage.createMenuItem({ name: "Fried Rice with Fried/Grilled Chicken", description: "Delicious fried rice served with your choice of fried or grilled chicken", price: 85, category: "main", available: true });
        await storage.createMenuItem({ name: "Jollof Rice with Fried/Grilled Chicken", description: "Ghanaian Jollof rice served with your choice of fried or grilled chicken", price: 85, category: "main", available: true });
        await storage.createMenuItem({ name: "Assorted Jollof / Fried Rice", description: "A mix of Jollof and Fried rice with assorted meats", price: 100, category: "main", available: true });
        await storage.createMenuItem({ name: "Special Tasty Waakye", description: "Traditional Ghanaian Waakye with all the trimmings", price: 65, category: "main", available: true });
        await storage.createMenuItem({ name: "Spicy Chicken Pizza (Large)", description: "Pizza topped with spicy chicken", price: 185, category: "main", available: true });
        await storage.createMenuItem({ name: "Beef Pizza (Large)", description: "Pizza topped with seasoned beef", price: 185, category: "main", available: true });
        await storage.createMenuItem({ name: "Spring Roll", description: "Crispy vegetable spring rolls", price: 15, category: "appetizer", available: true });
        await storage.createMenuItem({ name: "Samosa", description: "Savory pastry filled with meat or vegetables", price: 15, category: "appetizer", available: true });
        await storage.createMenuItem({ name: "Kelewele", description: "Spiced fried plantain chunks", price: 50, category: "appetizer", available: true });
        await storage.createMenuItem({ name: "Pineapple Juice (Big)", description: "Freshly squeezed pineapple juice", price: 25, category: "drink", available: true });
        await storage.createMenuItem({ name: "Sobolo Drink (Big)", description: "Traditional hibiscus drink", price: 25, category: "drink", available: true });
    }
    console.log("[seed] Database seeding check completed.");
  }

  seed();

  return httpServer;
}
