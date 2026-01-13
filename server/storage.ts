import { users, rooms, reservations, menuItems, orders, orderItems, messages, type User, type InsertUser, type Room, type Reservation, type MenuItem, type Order, type OrderItem, type Message } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: typeof rooms.$inferInsert): Promise<Room>;
  updateRoom(id: number, updates: Partial<typeof rooms.$inferInsert>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;

  getReservations(): Promise<Reservation[]>;
  createReservation(reservation: typeof reservations.$inferInsert): Promise<Reservation>;
  updateReservationStatus(id: number, status: string): Promise<Reservation | undefined>;

  getMenuItems(): Promise<MenuItem[]>;
  createMenuItem(item: typeof menuItems.$inferInsert): Promise<MenuItem>;
  deleteMenuItem(id: number): Promise<boolean>;
  updateMenuItem(id: number, updates: Partial<typeof menuItems.$inferInsert>): Promise<MenuItem | undefined>;

  getOrders(): Promise<Order[]>;
  createOrder(order: typeof orders.$inferInsert, items: { menuItemId: number; quantity: number }[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;

  getMessages(): Promise<Message[]>;
  createMessage(message: typeof messages.$inferInsert): Promise<Message>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(room: typeof rooms.$inferInsert): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    return newRoom;
  }

  async updateRoom(id: number, updates: Partial<typeof rooms.$inferInsert>): Promise<Room | undefined> {
    const [updatedRoom] = await db.update(rooms).set(updates).where(eq(rooms.id, id)).returning();
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<boolean> {
    const result = await db.delete(rooms).where(eq(rooms.id, id));
    return true;
  }

  async getReservations(): Promise<(Reservation & { guestName?: string; guestPhone?: string })[]> {
    const allReservations = await db.select().from(reservations);
    const reservationsWithUsers = await Promise.all(
      allReservations.map(async (res) => {
        const user = await this.getUser(res.userId);
        return {
          ...res,
          guestName: user?.name,
          guestPhone: user?.phoneNumber || undefined,
        };
      })
    );
    return reservationsWithUsers;
  }

  async createReservation(reservation: typeof reservations.$inferInsert): Promise<Reservation> {
    // Prevent double booking
    const existing = await db.select().from(reservations).where(
      eq(reservations.roomId, reservation.roomId)
    );
    
    const overlap = existing.some(r => {
      if (r.status === 'cancelled') return false;
      const start = new Date(r.checkIn);
      const end = new Date(r.checkOut);
      const newStart = new Date(reservation.checkIn);
      const newEnd = new Date(reservation.checkOut);
      return newStart < end && newEnd > start;
    });

    if (overlap) {
      throw new Error("Room is already booked for these dates");
    }

    const [newReservation] = await db.insert(reservations).values(reservation).returning();
    return newReservation;
  }

  async updateReservationStatus(id: number, status: string): Promise<Reservation | undefined> {
    const [updated] = await db.update(reservations).set({ status }).where(eq(reservations.id, id)).returning();
    return updated;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems);
  }

  async createMenuItem(item: typeof menuItems.$inferInsert): Promise<MenuItem> {
    const [newItem] = await db.insert(menuItems).values(item).returning();
    return newItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    await db.delete(menuItems).where(eq(menuItems.id, id));
    return true;
  }

  async updateMenuItem(id: number, updates: Partial<typeof menuItems.$inferInsert>): Promise<MenuItem | undefined> {
    const [updated] = await db.update(menuItems).set(updates).where(eq(menuItems.id, id)).returning();
    return updated;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async createOrder(order: typeof orders.$inferInsert, items: { menuItemId: number; quantity: number }[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    for (const item of items) {
      const [menuItem] = await db.select().from(menuItems).where(eq(menuItems.id, item.menuItemId));
      if (menuItem) {
        // Decrease stock level
        await db.update(menuItems)
          .set({ stockLevel: Math.max(0, menuItem.stockLevel - item.quantity) })
          .where(eq(menuItems.id, menuItem.id));

        await db.insert(orderItems).values({
          orderId: newOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          priceAtTime: menuItem.price
        });
      }
    }
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async createMessage(message: typeof messages.$inferInsert): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
