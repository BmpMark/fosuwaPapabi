import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";

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

  // Orders
  app.get(api.orders.list.path, async (req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.post(api.orders.create.path, async (req, res) => {
    const { order, items } = req.body;
    // Basic validation manual for nested structure
    const newOrder = await storage.createOrder(order, items);
    res.status(201).json(newOrder);
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    const order = await storage.updateOrderStatus(Number(req.params.id), req.body.status);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  // Seed data function (simple check)
  async function seed() {
    // Create admin account if none exist
    const adminExists = await storage.getUserByUsername("admin");
    if (!adminExists) {
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync("admin123", salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      await storage.createUser({ username: "admin", password: hashedPassword, role: "admin", name: "Admin User" });
    }
    
    const rooms = await storage.getRooms();
    if (rooms.length === 0) {
        await storage.createRoom({ number: "101", type: "single", price: 10000, description: "Cozy single room", capacity: 1, isAvailable: true });
        await storage.createRoom({ number: "201", type: "double", price: 18000, description: "Spacious double room with view", capacity: 2, isAvailable: true });
        await storage.createRoom({ number: "301", type: "suite", price: 35000, description: "Luxury suite", capacity: 4, isAvailable: true });
    }
    const menu = await storage.getMenuItems();
    if (menu.length === 0) {
        await storage.createMenuItem({ name: "Bruschetta", description: "Toasted bread with tomatoes", price: 800, category: "starter", available: true });
        await storage.createMenuItem({ name: "Steak Frites", description: "Grilled steak with fries", price: 2500, category: "main", available: true });
        await storage.createMenuItem({ name: "Tiramisu", description: "Classic coffee dessert", price: 900, category: "dessert", available: true });
    }
  }

  seed();

  return httpServer;
}
