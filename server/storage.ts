// import { db } from "./db.js";
// import { eq } from "drizzle-orm";
// import {
//   users,
//   rooms,
//   reservations,
//   menuItems,
//   orders,
//   orderItems,
//   messages,
// } from "../shared/schema.js";

// import type {
//   User,
//   InsertUser,
//   Room,
//   InsertRoom,
//   Reservation,
//   InsertReservation,
//   MenuItem,
//   InsertMenuItem,
//   Order,
//   InsertOrder,
//   OrderItem,
//   InsertOrderItem,
//   Message,
//   InsertMessage,
// } from "../shared/schema.js";

// export { db };

// // ---- USERS ----
// export async function createUser(data: InsertUser): Promise<User> {
//   const [user] = await db.insert(users).values(data).returning();
//   return user;
// }

// export async function getUserByUsername(username: string): Promise<User | undefined> {
//   const [user] = await db
//     .select()
//     .from(users)
//     .where(eq(users.username, username));

//   return user;
// }

// export async function getUser(id: number): Promise<User | undefined> {
//   const [user] = await db.select().from(users).where(eq(users.id, id));
//   return user;
// }

// // ---- ROOMS ----
// export async function getRooms(): Promise<Room[]> {
//   return db.select().from(rooms);
// }

// export async function getRoom(id: number): Promise<Room | undefined> {
//   const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
//   return room;
// }

// export async function createRoom(data: InsertRoom): Promise<Room> {
//   const [room] = await db.insert(rooms).values(data).returning();
//   return room;
// }

// export async function updateRoom(id: number, data: Partial<InsertRoom>) {
//   const [room] = await db.update(rooms).set(data).where(eq(rooms.id, id)).returning();
//   return room;
// }

// export async function deleteRoom(id: number) {
//   await db.delete(rooms).where(eq(rooms.id, id));
//   return true;
// }

// // ---- RESERVATIONS ----
// export async function createReservation(data: InsertReservation) {
//   const [r] = await db.insert(reservations).values(data).returning();
//   return r;
// }

// export async function getReservations() {
//   return db.select().from(reservations);
// }

// export async function updateReservationStatus(id: number, status: string) {
//   const [r] = await db.update(reservations).set({ status }).where(eq(reservations.id, id)).returning();
//   return r;
// }

// // ---- MENU ----
// export async function getMenuItems() {
//   return db.select().from(menuItems);
// }

// export async function createMenuItem(data: InsertMenuItem) {
//   const [item] = await db.insert(menuItems).values(data).returning();
//   return item;
// }

// export async function updateMenuItem(id: number, data: Partial<InsertMenuItem>) {
//   const [item] = await db.update(menuItems).set(data).where(eq(menuItems.id, id)).returning();
//   return item;
// }

// export async function deleteMenuItem(id: number) {
//   await db.delete(menuItems).where(eq(menuItems.id, id));
//   return true;
// }

// // ---- ORDERS ----
// export async function getOrders() {
//   return db.select().from(orders);
// }

// export async function createOrder(data: InsertOrder) {
//   const [order] = await db.insert(orders).values(data).returning();
//   return order;
// }

// export async function updateOrderStatus(id: number, status: string) {
//   const [o] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
//   return o;
// }

// // ---- ORDER ITEMS ----
// export async function createOrderItem(data: InsertOrderItem) {
//   const [item] = await db.insert(orderItems).values(data).returning();
//   return item;
// }

// // ---- MESSAGES ----
// export async function getMessages() {
//   return db.select().from(messages);
// }

// export async function createMessage(data: InsertMessage) {
//   const [m] = await db.insert(messages).values(data).returning();
//   return m;
// }


import { users, rooms, reservations, menuItems, orders, 
  orderItems, messages, notifications, type User, type InsertUser, type Room, type Reservation, type MenuItem, type Order, type OrderItem, type Message, type Notification } from "../shared/schema.js";
import { db } from "./db.js";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db.js";

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

  getNotifications(): Promise<Notification[]>;
  createNotification(notification: typeof notifications.$inferInsert): Promise<Notification>;
  markNotificationRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsRead(): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  db = db; // Expose db for direct operations in routes if needed

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

  async getMessages(): Promise<(Message & { sender?: { name: string } })[]> {
    const allMessages = await db.select().from(messages);
    return await Promise.all(
      allMessages.map(async (msg) => {
        const user = await this.getUser(msg.senderId);
        return {
          ...msg,
          sender: user ? { name: user.name } : undefined,
        };
      })
    );
  }

  async createMessage(message: typeof messages.$inferInsert): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async updateReservationPayment(id: number, data: { paymentIntentId?: string; paymentStatus?: string }) {
    const [updated] = await db
      .update(reservations)
      .set(data)
      .where(eq(reservations.id, id))
      .returning();
    return updated;
  }
  
  async updateOrderPayment(id: number, data: { paymentIntentId?: string; paymentStatus?: string }) {
    const [updated] = await db
      .update(orders)
      .set(data)
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }
  
  async getOrder(id: number) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
  
  async getReservation(id: number) {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation;
  }

  async getNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(notifications.createdAt);
  }

  async createNotification(notification: typeof notifications.$inferInsert): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return updated;
  }

  async markAllNotificationsRead(): Promise<void> {
    await db.update(notifications).set({ isRead: true });
  }
}



export const storage = new DatabaseStorage();